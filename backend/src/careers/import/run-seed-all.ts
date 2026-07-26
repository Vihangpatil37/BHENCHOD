/**
 * Unified Permanent Database Seeder (Phases 1-9)
 *
 * Runs all catalog imports (Parts 1-8) in sequence.
 * Finally runs the AI backfill refinement on any rule_based careers.
 *
 * Usage:
 *   npm run seed
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CareerSeedService } from './seed.service';
import { runAIBackfill } from './ai-backfill-runner';
import * as path from 'path';
import * as fs from 'fs';

interface PhaseConfig {
  part: string;
  fileName: string;
  label: string;
}

const phases: PhaseConfig[] = [
  {
    part: 'part_1_science',
    fileName: 'SCPR_Master_Career_Catalog_Part_1_Science_v2.md',
    label: 'Phase 1 — Science',
  },
  {
    part: 'part_2_commerce',
    fileName: 'SCPR_Master_Career_Catalog_Part_2_Commerce.md',
    label: 'Phase 2 — Commerce',
  },
  {
    part: 'part_3_arts_humanities',
    fileName: 'SCPR_Master_Career_Catalog_Part_3_Arts_Humanities.md',
    label: 'Phase 3 — Arts & Humanities',
  },
  {
    part: 'part_4_diploma',
    fileName: 'SCPR_Master_Career_Catalog_Part_4_Diploma.md',
    label: 'Phase 4 — Diploma',
  },
  {
    part: 'part_5_iti_polytechnic',
    fileName: 'SCPR_Master_Career_Catalog_Part_5_ITI_Polytechnic.md',
    label: 'Phase 5 — ITI & Polytechnic',
  },
  {
    part: 'part_6_vocational',
    fileName:
      'SCPR_Master_Career_Catalog_Part_6_Vocational_Skill_Development.md',
    label: 'Phase 6 — Vocational',
  },
  {
    part: 'part_7_government_defence',
    fileName: 'SCPR_Master_Career_Catalog_Part_7_Government_Defence.md',
    label: 'Phase 7 — Government & Defence',
  },
  {
    part: 'part_8_emerging_future',
    fileName: 'SCPR_Master_Career_Catalog_Part_8_Emerging_Future_Careers.md',
    label: 'Phase 8 — Emerging & Future',
  },
];

async function bootstrap() {
  console.log('\n============================================');
  console.log('  Unified Career Catalog Seeder (Phases 1-9)');
  console.log('============================================\n');

  const projectRoot = path.resolve(__dirname, '../../../../');

  // Verify all files exist before starting
  for (const phase of phases) {
    const filePath = path.join(projectRoot, phase.fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: ${phase.fileName} not found at ${filePath}`);
      process.exit(1);
    }
  }
  console.log('All 8 catalog files found.\nConnecting to MongoDB...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  console.log('Application initialized.\n');

  const seedService = app.get(CareerSeedService);
  const results: any[] = [];

  for (const phase of phases) {
    console.log(`\n---------- ${phase.label} ----------\n`);
    const filePath = path.join(projectRoot, phase.fileName);
    console.log(
      `File: ${phase.fileName} (${fs.statSync(filePath).size} bytes)`,
    );

    const result = await seedService.seedFromCatalog(filePath, phase.part);

    console.log(`  Leaves Found:     ${result.total_leaves_found}`);
    console.log(`  New Inserts:      ${result.new_inserts}`);
    console.log(`  Merged Duplicates: ${result.merged_duplicates}`);
    console.log(`  Enrichment Flagged: ${result.needs_enrichment_flagged}`);
    console.log(`  Overview Skipped:  ${result.overview_skipped}`);
    if (result.anomalies && result.anomalies.length > 0) {
      console.log(`  Anomalies: ${result.anomalies.join(', ')}`);
    }

    results.push(result);
  }

  console.log('\n============================================');
  console.log('  IMPORT SUMMARY (PHASES 1-8)');
  console.log('============================================\n');

  let totalNew = 0;
  let totalMerged = 0;

  for (const r of results) {
    console.log(
      `  ${r.catalogPart}: +${r.new_inserts} new, ${r.merged_duplicates} merged`,
    );
    totalNew += r.new_inserts;
    totalMerged += r.merged_duplicates;
  }

  console.log(`\n  Total new careers added: ${totalNew}`);
  console.log(`  Total duplicates merged: ${totalMerged}`);

  console.log('\nStarting Phase 9 (AI Backfill Refinement)...\n');
  await runAIBackfill(app);

  await app.close();
  console.log('\nAll phases 1-9 complete! Seed process finished successfully.\n');
}

bootstrap().catch((err) => {
  console.error('Unified seed runner failed:', err);
  process.exit(1);
});
