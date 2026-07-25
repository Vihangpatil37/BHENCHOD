/**
 * Publish Drafts — Promotes all AI backfilled drafts to live trait_weights and eligibility.
 *
 * Runs the adminBulkPublish method directly through NestJS app context.
 * After this, trait_weights_draft and eligibility_draft fields are cleared
 * and their values are moved to trait_weights and eligibility.
 * backfill_status is set to 'published'.
 *
 * Usage:
 *   cd backend
 *   npx ts-node src/careers/import/publish-drafts.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Career, CareerDocument } from '../schemas/career.schema';

async function bootstrap() {
  console.log('\n============================================');
  console.log('  Publish All AI Backfilled Drafts');
  console.log('============================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  console.log('Application initialized.\n');

  const careerModel = app.get<Model<CareerDocument>>(
    getModelToken(Career.name),
  );

  // Query careers with drafts
  const draftCount = await careerModel
    .countDocuments({
      $or: [
        { trait_weights_draft: { $exists: true, $ne: null } },
        { eligibility_draft: { $exists: true, $ne: null } },
      ],
    })
    .exec();

  console.log(`Found ${draftCount} careers with pending drafts.\n`);

  if (draftCount === 0) {
    console.log('Nothing to publish — no drafts found.\n');
    await app.close();
    return;
  }

  // Find and publish all careers with drafts
  const careers = await careerModel
    .find({
      $or: [
        { trait_weights_draft: { $exists: true, $ne: null } },
        { eligibility_draft: { $exists: true, $ne: null } },
      ],
    })
    .exec();

  console.log(
    'Publishing all drafts to live trait_weights and eligibility...\n',
  );

  let published = 0;
  for (const career of careers) {
    if (career.trait_weights_draft) {
      career.trait_weights = career.trait_weights_draft;
      career.trait_weights_draft = undefined;
    }
    if (career.eligibility_draft) {
      career.eligibility = career.eligibility_draft;
      career.eligibility_draft = undefined;
    }
    career.backfill_status = 'published';
    await career.save();
    published++;
  }

  console.log('============================================');
  console.log('  PUBLISH COMPLETE');
  console.log('============================================');
  console.log(`  Careers with drafts:  ${draftCount}`);
  console.log(`  Published:            ${published}`);
  console.log(
    `  Message:              Published drafts for ${published} careers`,
  );
  console.log(
    '\nAll draft fields promoted to live. backfill_status set to "published".\n',
  );

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Publish script failed:', err);
  process.exit(1);
});
