/**
 * Phase 1 Seed Runner — Science Catalog Import
 *
 * This script creates a NestJS application context and runs the
 * CareerSeedService to import Part 1 (Science) catalog into MongoDB.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/careers/import/run-seed-part-1.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CareerSeedService } from './seed.service';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  console.log('\n===== Phase 1 Seed Runner — Science Catalog =====\n');

  // Resolve file path
  const projectRoot = path.resolve(__dirname, '../../../../');
  const catalogFile = path.join(projectRoot, 'SCPR_Master_Career_Catalog_Part_1_Science_v2.md');

  // Verify file exists
  if (!fs.existsSync(catalogFile)) {
    console.error(`ERROR: Catalog file not found at: ${catalogFile}`);
    process.exit(1);
  }
  console.log(`Catalog file: ${catalogFile}`);
  console.log(`File size: ${fs.statSync(catalogFile).size} bytes\n`);

  // Create NestJS application context
  console.log('Connecting to MongoDB and initializing application...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  console.log('Application initialized successfully.\n');

  // Get the seed service and run the import
  const seedService = app.get(CareerSeedService);

  console.log('Starting Phase 1 import...');
  const result = await seedService.seedFromCatalog(
    catalogFile,
    'part_1_science',
  );

  // Print results
  console.log('\n===== Phase 1 Import Results =====');
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

  console.log('\nPhase 1 complete!');

  // Close the application context
  await app.close();
  console.log('Connection closed.\n');
}

bootstrap().catch((err) => {
  console.error('Seed runner failed:', err);
  process.exit(1);
});
