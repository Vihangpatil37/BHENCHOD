/**
 * Phase 11 — Roadmap Importer
 *
 * Reads SCPR_All_Careers_Detailed_Mermaid_Roadmaps.md and injects
 * roadmap_mermaid and roadmap_steps into the corresponding Careers in MongoDB.
 *
 * Usage:
 *   cd backend
 *   npm run seed:roadmaps
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Career, CareerDocument } from '../schemas/career.schema';
import * as fs from 'fs';
import * as path from 'path';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

async function runRoadmapImport() {
  console.log('\n============================================');
  console.log('  Roadmap Importer');
  console.log('============================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const careerModel = app.get<Model<CareerDocument>>(getModelToken(Career.name));

  const mdPath = path.resolve(__dirname, '../../../../SCPR_All_Careers_Detailed_Mermaid_Roadmaps.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`ERROR: Could not find ${mdPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf-8');
  
  const blocks = content.split(/^## \d+\.\s+/m).slice(1);
  console.log(`Found ${blocks.length} career blocks in the markdown file.\n`);

  let matchedCount = 0;
  let updatedCount = 0;
  let unmatchedCount = 0;
  let duplicateNameCount = 0;
  let invalidMermaidCount = 0;

  const unmatchedLogs: string[] = [];
  const duplicateLogs: string[] = [];
  const invalidMermaidLogs: string[] = [];

  for (const block of blocks) {
    const firstLineEnd = block.indexOf('\n');
    const careerNameRaw = block.substring(0, firstLineEnd).trim();
    
    let sourcePath = '';
    const sourcePathMatch = block.match(/\*\*Source Path:\*\*\s*(.+)/i);
    if (sourcePathMatch) {
      sourcePath = sourcePathMatch[1].trim();
    }

    let roadmapMermaid = '';
    const mermaidMatch = block.match(/```mermaid\n([\s\S]*?)```/);
    if (mermaidMatch) {
      roadmapMermaid = mermaidMatch[1].trim();
    }

    if (!roadmapMermaid || roadmapMermaid.length < 10) {
      invalidMermaidCount++;
      invalidMermaidLogs.push(`Invalid/missing Mermaid block for: ${careerNameRaw}`);
      continue;
    }

    const steps: string[] = [];
    const stepsSectionMatch = block.match(/### Roadmap Steps\n\n([\s\S]*?)(?:\n---|^\s*$)/m);
    
    if (stepsSectionMatch) {
      const stepsText = stepsSectionMatch[1];
      const stepLines = stepsText.split('\n');
      for (const line of stepLines) {
        const stepMatch = line.match(/^\d+\.\s*(.+)/);
        if (stepMatch) {
          let step = stepMatch[1].trim();
          if (step.startsWith('**') && step.endsWith('**')) {
            step = step.substring(2, step.length - 2);
          }
          steps.push(step);
        }
      }
    }

    const candidatesByName = await careerModel.find({ name: { $regex: new RegExp(`^${careerNameRaw}$`, 'i') } });
    
    let targetCareer: CareerDocument | null = null;

    if (candidatesByName.length === 1) {
      targetCareer = candidatesByName[0];
    } else if (candidatesByName.length > 1) {
      duplicateNameCount++;
      duplicateLogs.push(`Multiple careers found for name: "${careerNameRaw}"`);
      continue;
    } else {
      const pathParts = sourcePath.split('→').map(p => p.trim());
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const candidatesByPath = await careerModel.find({ name: { $regex: new RegExp(`^${lastPart}$`, 'i') } });
        if (candidatesByPath.length === 1) {
          targetCareer = candidatesByPath[0];
        } else if (candidatesByPath.length > 1) {
          duplicateNameCount++;
          duplicateLogs.push(`Multiple careers found for source path fallback: "${lastPart}" (Original name: ${careerNameRaw})`);
          continue;
        }
      }
    }

    if (!targetCareer) {
      unmatchedCount++;
      unmatchedLogs.push(`Unmatched: "${careerNameRaw}" | Source Path: "${sourcePath}"`);
      continue;
    }

    matchedCount++;

    let needsUpdate = false;
    if (targetCareer.roadmap_mermaid !== roadmapMermaid) {
      targetCareer.roadmap_mermaid = roadmapMermaid;
      needsUpdate = true;
    }
    
    const currentStepsStr = JSON.stringify(targetCareer.roadmap_steps || []);
    const newStepsStr = JSON.stringify(steps);
    if (currentStepsStr !== newStepsStr) {
      targetCareer.roadmap_steps = steps;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await targetCareer.save();
      updatedCount++;
    }
  }

  console.log('============================================');
  console.log('  IMPORT METRICS');
  console.log('============================================');
  console.log(`  Blocks parsed:          ${blocks.length}`);
  console.log(`  matched:                ${matchedCount}`);
  console.log(`  updated:                ${updatedCount}`);
  console.log(`  unmatched:              ${unmatchedCount}`);
  console.log(`  duplicate names:        ${duplicateNameCount}`);
  console.log(`  invalid Mermaid blocks: ${invalidMermaidCount}\n`);

  if (unmatchedCount > 0) {
    console.log('--- Unmatched Careers ---');
    unmatchedLogs.forEach(log => console.log('  ' + log));
    console.log();
  }

  if (duplicateNameCount > 0) {
    console.log('--- Duplicate Names (Ambiguous) ---');
    duplicateLogs.forEach(log => console.log('  ' + log));
    console.log();
  }

  if (invalidMermaidCount > 0) {
    console.log('--- Invalid/Missing Mermaid ---');
    invalidMermaidLogs.forEach(log => console.log('  ' + log));
    console.log();
  }

  await app.close();
  console.log('Done.');
}

runRoadmapImport().catch(err => {
  console.error(err);
  process.exit(1);
});
