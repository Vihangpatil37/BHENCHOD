/**
 * Phase 1 — Science Catalog Import
 *
 * Parses SCPR_Master_Career_Catalog_Part_1_Science_v2.md,
 * deduplicates against existing careers, applies rule-based
 * trait_weights and eligibility, and upserts into the Career collection.
 *
 * Usage:
 *   import { NestFactory } from '@nestjs/core';
 *   import { AppModule } from '../app.module';
 *   import { CareerSeedService } from './seed.service';
 *
 *   const app = await NestFactory.createApplicationContext(AppModule);
 *   const seedService = app.get(CareerSeedService);
 *   const result = await seedService.seedFromCatalog(
 *     'SCPR_Master_Career_Catalog_Part_1_Science_v2.md',
 *     'part_1_science',
 *   );
 *   console.log(result);
 *   await app.close();
 *
 * Or run via the CLI seed command configured in careers.module.
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('SeedPart1');

export const PART_1_CONFIG = {
  catalogPart: 'part_1_science' as const,
  fileName: 'SCPR_Master_Career_Catalog_Part_1_Science_v2.md',
  categoryCode: 'science',
};

/**
 * Returns the expected file path for the Part 1 catalog.
 * Searhes in common locations relative to the project root.
 */
export function resolvePart1Path(projectRoot?: string): string {
  const base = projectRoot || process.cwd();
  return `${base}/${PART_1_CONFIG.fileName}`;
}

logger.log(
  `Part 1 seed script loaded. Config: ${JSON.stringify(PART_1_CONFIG)}`,
);
