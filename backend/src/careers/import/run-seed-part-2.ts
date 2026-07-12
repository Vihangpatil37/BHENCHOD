/**
 * Phase 2 Seed Runner — Commerce Catalog Import
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/careers/import/run-seed-part-2.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CareerSeedService } from './seed.service';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  console.log('\n===== Phase 2 Seed Runner — Commerce Catalog =====\n');

  const projectRoot = path.resolve(__dirname, '../../../../');
  const catalogFile = path.join(projectRoot, 'SCPR_Master_Career_Catalog_Part_2_Commerce.md');

  if (!fs.existsSync(catalogFile)) {
    console.error(`ERROR: Catalog file not found at: ${catalogFile}`);
    process.exit(1);
  }
  console.log(`Catalog file: ${catalogFile}`);
  console.log(`File size: ${fs.statSync(catalogFile).size} bytes\n`);

  console.log('Connecting to MongoDB and initializing application...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  console.log('Application initialized successfully.\n');

  const seedService = app.get(CareerSeedService);

  console.log('Starting Phase 2 import...');
  const result = await seedService.seedFromCatalog(
    catalogFile,
    'part_2_commerce',
  );

  console.log('\n===== Phase 2 Import Results =====');
  console.log(`Catalog Part:     ${result.catalogPart}`);
  console.log(`Category:         ${result.categoryCode}`);
  console.log(`Leaves Found:     ${result.total_leaves_found}`);
  console.log(`New Inserts:      ${result.new_inserts}`);
  console.log(`Merged Dups:      ${result.merged_duplicates}`);
  console.log(`Enrichment Flag:  ${result.needs_enrichment_flagged}`);
  console.log(`Overview Skipped: ${result.overview_skipped}`);
  console.log(`Timestamp:        ${result.timestamp}`);

  if (result.anomalies.length > 0) {
    console.log('\nAnomalies:');
    for (const anomaly of result.anomalies) {
      console.log(`  - ${anomaly}`);
    }
  }

  console.log('\nPhase 2 complete!');
  await app.close();
  console.log('Connection closed.\n');
}

bootstrap().catch((err) => {
  console.error('Seed runner failed:', err);
  process.exit(1);
});
