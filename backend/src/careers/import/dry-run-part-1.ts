/**
 * Dry-run parser for Phase 1 — Science catalog.
 * This script parses the catalog file and reports what would be imported,
 * without needing a database connection.
 *
 * Usage: npx ts-node src/careers/import/dry-run-part-1.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  extractFencedBlock,
  parseTreeToLeaves,
  parseTreeLine,
  slugify,
  computeSubDomainCode,
} from './tree-parser.service';
import { computeTraitWeights } from './default-weights.config';
import { computeEligibility } from './default-eligibility.config';
import { CATALOG_TO_CATEGORY, isValidSubDomain } from './taxonomy.config';

const catalogPart = 'part_1_science';
const filePath = path.resolve(
  __dirname,
  '../../../../SCPR_Master_Career_Catalog_Part_1_Science_v2.md',
);
const categoryCode = CATALOG_TO_CATEGORY[catalogPart];

console.log(`\n===== Phase 1 Dry Run — ${catalogPart} =====`);
console.log(`Category: ${categoryCode}`);
console.log(`File: ${filePath}\n`);

// Read file
const content = fs.readFileSync(filePath, 'utf-8');
console.log(`File size: ${content.length} bytes\n`);

// Extract fenced block
const treeBlock = extractFencedBlock(content);
if (!treeBlock) {
  console.error('ERROR: No fenced code block found!');
  process.exit(1);
}

console.log(`Fenced block size: ${treeBlock.length} bytes\n`);

// Parse tree
const leaves = parseTreeToLeaves(treeBlock);
console.log(`Total leaves found: ${leaves.length}\n`);

// Count Overview-skipped nodes
let overviewSkipped = 0;
let inOverview = false;
let overviewDepth = -1;
const lines = treeBlock.split('\n');
for (const line of lines) {
  const parsed = parseTreeLine(line);
  if (!parsed) continue;

  if (parsed.text.toLowerCase() === 'overview') {
    inOverview = true;
    overviewDepth = parsed.depth;
    continue;
  }
  if (inOverview && parsed.depth > overviewDepth) {
    overviewSkipped++;
    continue;
  }
  if (inOverview && parsed.depth <= overviewDepth) {
    inOverview = false;
    overviewDepth = -1;
  }
}

console.log(`Overview nodes skipped: ${overviewSkipped}\n`);

// Group leaves by sub-domain source
const bySubDomain: Record<string, number> = {};
const byPathway: Record<string, number> = {};
let broadDegreeCount = 0;
let enrichmentCount = 0;

const broadDegreeKeywords = [
  'engineering',
  'bachelor',
  'master',
  'b.sc',
  'b.com',
  'b.a',
  'm.sc',
  'm.com',
  'm.a',
  'b.tech',
  'm.tech',
  'b.e',
  'm.e',
  'm.b.a',
  'b.b.a',
  'b.c.a',
  'm.c.a',
  'b.pharma',
  'b.arch',
  'b.des',
  'b.f.a',
  'b.p.ed',
  'b.ed',
  'm.ed',
];

for (const leaf of leaves) {
  const rawSubDomain = computeSubDomainCode(leaf.sub_domain_source);
  const prefixedSubDomain = `${categoryCode}_${rawSubDomain}`;
  const subDomainCode = isValidSubDomain(categoryCode, rawSubDomain)
    ? rawSubDomain
    : isValidSubDomain(categoryCode, prefixedSubDomain)
      ? prefixedSubDomain
      : rawSubDomain;
  bySubDomain[subDomainCode] = (bySubDomain[subDomainCode] || 0) + 1;

  for (const tag of leaf.pathway_tags) {
    byPathway[tag] = (byPathway[tag] || 0) + 1;
  }

  const nameLower = leaf.name.toLowerCase();
  const isBroadDegree = broadDegreeKeywords.some((kw) =>
    nameLower.includes(kw),
  );

  if (isBroadDegree) {
    broadDegreeCount++;
  }

  const { needs_enrichment } = computeEligibility(categoryCode, subDomainCode);
  if (needs_enrichment) {
    enrichmentCount++;
  }
}

console.log('=== Sub-domain breakdown ===');
for (const [code, count] of Object.entries(bySubDomain).sort(
  (a, b) => b[1] - a[1],
)) {
  const slugified = computeSubDomainCode(code);
  console.log(`  ${code}: ${count} careers`);
}

console.log('\n=== Pathway tag frequency (top 15) ===');
const sortedPathways = Object.entries(byPathway).sort((a, b) => b[1] - a[1]);
for (const [tag, count] of sortedPathways.slice(0, 15)) {
  console.log(`  ${tag}: ${count}`);
}

console.log(`\nBroad degree leaves (needs_enrichment): ${broadDegreeCount}`);
console.log(`Government enrichment flagged: ${enrichmentCount}`);

// Print sample leaves
console.log('\n=== Sample leaves (first 20) ===');
for (const leaf of leaves.slice(0, 20)) {
  const rawSubDomain = computeSubDomainCode(leaf.sub_domain_source);
  const prefixedSubDomain = `${categoryCode}_${rawSubDomain}`;
  const subDomainCode = isValidSubDomain(categoryCode, rawSubDomain)
    ? rawSubDomain
    : isValidSubDomain(categoryCode, prefixedSubDomain)
      ? prefixedSubDomain
      : rawSubDomain;
  const weights = computeTraitWeights(categoryCode, leaf.name);
  const { eligibility, needs_enrichment } = computeEligibility(
    categoryCode,
    subDomainCode,
  );
  console.log(`  ${leaf.career_code}`);
  console.log(`    Name: ${leaf.name}`);
  console.log(
    `    Sub-domain: ${subDomainCode} (from: "${leaf.sub_domain_source}")`,
  );
  console.log(`    Pathway: [${leaf.pathway_tags.join(', ')}]`);
  console.log(
    `    Traits: AT=${weights.analytical_thinking} CR=${weights.creativity} TC=${weights.technical_curiosity}`,
  );
  console.log(
    `    Eligibility: math=${eligibility.min_maths} sci=${eligibility.min_science} stream=${eligibility.required_stream}`,
  );
  console.log(`    Enrichment: ${needs_enrichment}`);
  console.log('');
}

// Check specific important careers
const importantCodes = [
  'software_engineer',
  'ai_engineer',
  'data_scientist',
  'mechanical_engineer',
  'civil_engineer',
  'architect',
  'general_physician',
  'surgeon',
  'biomedical_engineering',
];

console.log('=== Important careers check ===');
for (const code of importantCodes) {
  const found = leaves.find((l) => l.career_code === code);
  console.log(`  ${code}: ${found ? 'FOUND ✓' : 'MISSED ✗'}`);
}

console.log(`\n===== Dry Run Complete =====`);
console.log(`Total: ${leaves.length} career leaves ready for import`);
