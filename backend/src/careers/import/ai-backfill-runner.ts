/**
 * Phase 9 — AI Backfill Refinement Runner
 *
 * Calls `career_trait_backfill` for every career with `backfill_status: 'rule_based'`,
 * one at a time, writing results to `trait_weights_draft` / `eligibility_draft` only.
 *
 * Design:
 * - Resumable: re-query for `backfill_status === 'rule_based'` on each start
 * - Rate-limited to 1 concurrent request with 3s inter-career delay
 * - 429 rate-limit errors trigger exponential backoff retry (up to 3 retries)
 * - Uses existing AI service routing (Gemini 2.5 Flash → Groq llama-3.3-70b → Groq llama-3.1-8b)
 * - Never touches live `trait_weights` or `eligibility` fields
 * - Logs progress to console for monitoring
 * - Respects existing `cache.service` (identical context → cached response)
 * - Respects existing `token-logger.service` (logs every AI call)
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/careers/import/ai-backfill-runner.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Career,
  CareerDocument,
  CareerTraitProfile,
} from '../schemas/career.schema';
import { AIServiceClient } from '../../ai-service/ai-service.client';

import { INestApplicationContext } from '@nestjs/common';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runAIBackfill(app: INestApplicationContext) {
  console.log('\n============================================');
  console.log('  Phase 9 — AI Backfill Refinement');
  console.log('============================================\n');

  console.log('Starting Phase 9 AI Backfill Refinement...');

  const aiService = app.get(AIServiceClient);
  const careerModel = app.get<Model<CareerDocument>>(
    getModelToken(Career.name),
  );

  // Query all rule_based careers (resumable — already-refined careers excluded)
  const totalCareers = await careerModel
    .countDocuments({ backfill_status: 'rule_based' })
    .exec();
  console.log(
    `Found ${totalCareers} careers with backfill_status=rule_based\n`,
  );

  if (totalCareers === 0) {
    console.log('Nothing to backfill. All careers already refined.\n');
    await app.close();
    return;
  }

  const careers = await careerModel
    .find({ backfill_status: 'rule_based' })
    .sort({ imported_at: 1 })
    .exec();

  let successCount = 0;
  let failCount = 0;
  let rateLimitFailures = 0; // careers that ultimately failed due to rate limits after retries
  const startTime = Date.now();

  const CAREER_DELAY_MS = 3000;
  const MAX_429_RETRIES = 3;

  console.log(
    `Processing ${careers.length} careers one at a time with ${CAREER_DELAY_MS / 1000}s delay...\n`,
  );

  for (let idx = 0; idx < careers.length; idx++) {
    const career = careers[idx];

    if (career.backfill_status !== 'rule_based') {
      continue;
    }

    let lastError: Error | undefined;
    let attempts = 0;
    let wasRateLimited = false;

    while (attempts <= MAX_429_RETRIES) {
      attempts++;
      try {
        // Schema validation is now handled by json-validator via taskType
        const response = await aiService.run('career_trait_backfill', {
          career_name: career.name,
          career_description: career.description || career.name,
          required_skills: career.required_skills || [],
        });

        if (response.success && response.data) {
          const data = response.data;

          // Extract trait_weights with defaults for any missing traits
          const rawTraits = data.trait_weights || {};
          const trait_weights: CareerTraitProfile = {
            analytical_thinking: 50,
            creativity: 50,
            communication: 50,
            leadership: 50,
            research: 50,
            business_acumen: 50,
            technical_curiosity: 50,
            empathy: 50,
            patience: 50,
            risk_tolerance: 50,
          };
          const traitKeys = [
            'analytical_thinking',
            'creativity',
            'communication',
            'leadership',
            'research',
            'business_acumen',
            'technical_curiosity',
            'empathy',
            'patience',
            'risk_tolerance',
          ];
          for (const key of traitKeys) {
            const val = Number(rawTraits[key]);
            if (!isNaN(val)) {
              (trait_weights as any)[key] = Math.max(
                0,
                Math.min(100, Math.round(val)),
              );
            }
          }

          // Extract eligibility with defaults for missing fields
          const rawElig = data.eligibility || {};
          const toNum = (v: any, fb: number) => {
            const n = Number(v);
            return !isNaN(n) ? n : fb;
          };
          const minStudyYears = toNum(rawElig.min_study_duration_years, 3);

          const eligibility = {
            min_maths: toNum(rawElig.min_maths, 30),
            min_science: toNum(rawElig.min_science, 30),
            min_biology: toNum(rawElig.min_biology, 0),
            min_english: toNum(rawElig.min_english, 0),
            max_budget_tier: toNum(rawElig.max_budget_tier, 2),
            min_study_duration_years: minStudyYears,
            max_study_duration_years: toNum(
              rawElig.max_study_duration_years,
              minStudyYears + 2,
            ),
            required_stream: rawElig.required_stream || 'any',
            abroad_required: rawElig.abroad_required === true,
          };

          career.trait_weights_draft = trait_weights;
          career.eligibility_draft = eligibility;
          career.backfill_status = 'ai_refined';
          await career.save();
          successCount++;
          break; // exit retry loop
        } else {
          lastError = new Error('AI returned success=false');
          break;
        }
      } catch (err: any) {
        lastError = err;
        const is429 =
          err.message &&
          (err.message.includes('429') ||
            err.message.includes('Quota exceeded') ||
            err.message.includes('Rate limit') ||
            err.message.includes('quota') ||
            err.message.includes('RESOURCE_EXHAUSTED'));

        if (is429 && attempts <= MAX_429_RETRIES) {
          wasRateLimited = true;
          const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 15000);
          console.log(
            `  ⏳ ${career.career_code}: Rate limited (attempt ${attempts}/${MAX_429_RETRIES}), backing off ${backoffMs / 1000}s`,
          );
          await sleep(backoffMs);
        } else if (is429) {
          wasRateLimited = true;
          break;
        } else {
          break;
        }
      }
    }

    if (lastError && career.backfill_status !== 'ai_refined') {
      failCount++;
      if (wasRateLimited) rateLimitFailures++;
      const msg =
        lastError.message.length > 100
          ? lastError.message.substring(0, 100) + '…'
          : lastError.message;
      console.error(`  ✗ ${career.career_code}: ${msg}`);
    }

    // Progress log every 10 careers
    if ((idx + 1) % 10 === 0 || idx === careers.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = (((idx + 1) / careers.length) * 100).toFixed(1);
      console.log(
        `  [${idx + 1}/${careers.length}] ${pct}% — ${successCount} OK, ${failCount} failed (${rateLimitFailures} rate-limited) — ${elapsed}s`,
      );
    }

    // Inter-career delay for rate-limit backpressure
    if (idx < careers.length - 1) {
      await sleep(CAREER_DELAY_MS);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n============================================');
  console.log('  BACKFILL COMPLETE');
  console.log('============================================');
  console.log(`  Total careers:     ${careers.length}`);
  console.log(`  Success:           ${successCount}`);
  console.log(`  Failed:            ${failCount}`);
  console.log(`  Rate-limited dead: ${rateLimitFailures}`);
  console.log(`  Time elapsed:      ${totalTime}s`);
  console.log(
    '\nAll draft fields written. Use Admin Panel (Phase 10) to review and publish.\n',
  );
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  await runAIBackfill(app);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Backfill runner failed:', err);
  process.exit(1);
});
