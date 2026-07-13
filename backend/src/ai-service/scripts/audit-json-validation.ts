import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from '../../recommendation/schemas/recommendation.schema';
import { Career } from '../../careers/schemas/career.schema';
import { ConversationMessage } from '../../counselor/schemas/conversation-message.schema';
import { Conversation } from '../../counselor/schemas/conversation.schema';
import { JsonValidatorService } from '../json-validator.service';
import * as fs from 'fs';
import * as path from 'path';

interface AuditEntry {
  _id: string;
  taskType: string;
  source: string;
  createdAt?: string;
  errors: string[];
}

const OUT = path.resolve(__dirname, '../../../VALIDATION_AUDIT_REPORT.md');

async function bootstrap() {
  console.log('\n=== JSON Validation Audit ===\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const validator = app.get(JsonValidatorService);
  const recModel = app.get<Model<Recommendation>>(getModelToken(Recommendation.name));
  const careerModel = app.get<Model<Career>>(getModelToken(Career.name));
  const msgModel = app.get<Model<ConversationMessage>>(getModelToken(ConversationMessage.name));
  const convModel = app.get<Model<Conversation>>(getModelToken(Conversation.name));

  const all: AuditEntry[] = [];

  // 1. Recommendations
  console.log('Querying Recommendations...');
  const recs = await recModel.find().lean().exec();
  for (const r of recs) {
    if (!r.final_recommendations || r.final_recommendations.length === 0) continue;
    const data = { final_recommendations: r.final_recommendations };
    const result = validator.validate('career_recommendation', data);
    if (!result.valid) {
      all.push({
        _id: String(r._id),
        taskType: 'career_recommendation',
        source: 'Recommendation',
        createdAt: (r as any).generated_at?.toISOString?.() || '',
        errors: result.errors!.map(e => `${e.instancePath} ${e.message}`),
      });
    }
  }
  console.log(`  ${recs.length} docs, ${all.filter(e => e.source === 'Recommendation').length} failures`);

  // 2. Careers (ai_refined / published)
  console.log('Querying Careers...');
  const careers = await careerModel.find({ backfill_status: { $in: ['ai_refined', 'published'] } }).lean().exec();
  const careerFailures: AuditEntry[] = [];
  for (const c of careers) {
    const draft = c.trait_weights_draft || c.trait_weights;
    const elig = c.eligibility_draft || c.eligibility;
    if (!draft || !elig) continue;
    const data = { trait_weights: draft, eligibility: elig };
    const result = validator.validate('career_trait_backfill', data);
    if (!result.valid) {
      careerFailures.push({
        _id: String(c._id),
        taskType: 'career_trait_backfill',
        source: 'Career',
        createdAt: (c as any).updated_at?.toISOString?.() || '',
        errors: result.errors!.map(e => `${e.instancePath} ${e.message}`),
      });
    }
  }
  all.push(...careerFailures);
  console.log(`  ${careers.length} docs, ${careerFailures.length} failures`);

  // 3. ConversationMessages (is_structured)
  console.log('Querying ConversationMessages...');
  const msgs = await msgModel.find({ is_structured: true }).lean().exec();
  const msgFailures: AuditEntry[] = [];
  for (const m of msgs) {
    // Stored content is the AI reply text (string), not the full JSON object
    // Try parsing as JSON first; if it's raw text, check non-empty
    let parsed: any;
    try { parsed = JSON.parse(m.content); } catch { parsed = null; }
    if (parsed) {
      const result = validator.validate('counselor_chat', parsed);
      if (!result.valid) {
        msgFailures.push({
          _id: String(m._id),
          taskType: 'counselor_chat',
          source: 'ConversationMessage',
          createdAt: (m as any).created_at?.toISOString?.() || '',
          errors: result.errors!.map(e => `${e.instancePath} ${e.message}`),
        });
      }
    } else if (!m.content || m.content.trim().length === 0) {
      msgFailures.push({
        _id: String(m._id),
        taskType: 'counselor_chat',
        source: 'ConversationMessage',
        createdAt: (m as any).created_at?.toISOString?.() || '',
        errors: ['empty content'],
      });
    }
  }
  all.push(...msgFailures);
  console.log(`  ${msgs.length} docs, ${msgFailures.length} failures`);

  // 4. Conversation summaries (report_summary task output)
  console.log('Querying Conversation summaries...');
  const convs = await convModel.find({ summary: { $ne: '', $exists: true } }).lean().exec();
  const convFailures: AuditEntry[] = [];
  for (const c of convs) {
    const data = { summary_text: c.summary };
    const result = validator.validate('report_summary', data);
    if (!result.valid) {
      convFailures.push({
        _id: String(c._id),
        taskType: 'report_summary',
        source: 'Conversation',
        createdAt: (c as any).updated_at?.toISOString?.() || '',
        errors: result.errors!.map(e => `${e.instancePath} ${e.message}`),
      });
    }
  }
  all.push(...convFailures);
  console.log(`  ${convs.length} docs, ${convFailures.length} failures`);

  // Write report
  const byType = new Map<string, AuditEntry[]>();
  for (const entry of all) {
    const arr = byType.get(entry.taskType) || [];
    arr.push(entry);
    byType.set(entry.taskType, arr);
  }

  const lines: string[] = [
    '# JSON Validation Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Source | Total | Failures |`,
    `|---|---|---|`,
    `| Recommendation.final_recommendations | ${recs.length} | ${all.filter(e => e.source === 'Recommendation').length} |`,
    `| Career.trait_weights/eligibility (ai_refined/published) | ${careers.length} | ${careerFailures.length} |`,
    `| ConversationMessage (is_structured) | ${msgs.length} | ${msgFailures.length} |`,
    `| Conversation.summary | ${convs.length} | ${convFailures.length} |`,
    `| **Total** | **${recs.length + careers.length + msgs.length + convs.length}** | **${all.length}** |`,
    '',
  ];

  if (all.length === 0) {
    lines.push('✅ All stored documents pass validation against the corrected schemas.');
  } else {
    lines.push('## Per-Document Failures');
    lines.push('');
    lines.push('> Read-only diagnostic. Do not auto-correct or delete any document.');
    lines.push('');
    for (const [taskType, entries] of byType) {
      lines.push(`### ${taskType}`);
      lines.push('');
      lines.push(`| _id | Source | Errors |`);
      lines.push(`|---|---|---|`);
      for (const e of entries) {
        const dateStr = e.createdAt ? e.createdAt.substring(0, 10) : '';
        lines.push(`| \`${e._id}\` ${dateStr ? `(${dateStr})` : ''} | ${e.source} | ${e.errors.join('; ')} |`);
      }
      lines.push('');
    }

    // ponytail: prompt says to flag pre-fix data separately; using ~July 1 as rough cutoff
    const preFixEntries = all.filter(e => e.createdAt && e.createdAt < '2026-07-01');
    if (preFixEntries.length > 0) {
      lines.push('## Pre-Fix Backfill Data');
      lines.push('');
      lines.push(`The following ${preFixEntries.length} entries were created before the validator fix (approximate cutoff: 2026-07-01):`);
      lines.push('');
      for (const e of preFixEntries) {
        lines.push(`- \`${e._id}\` (${e.taskType}, ${e.createdAt?.substring(0, 10)}): ${e.errors.join('; ')}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('*Zero writes performed. This report is diagnostic only.*');
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'), 'utf-8');
  console.log(`\nReport written to: ${OUT}`);
  console.log(`Total failures: ${all.length}`);
  console.log('\nDone.\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
