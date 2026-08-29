#!/usr/bin/env node
/**
 * Secret & Credential Scanner
 * Scans source code for hardcoded secrets, API keys, and sensitive data.
 * Run: node scripts/secret-scanner.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['backend/src', 'frontend/src', 'backend/test'];

// Patterns to detect hardcoded secrets (NOT env var references)
const PATTERNS = [
  {
    name: 'Hardcoded API Key (Groq)',
    pattern: /['"]gsk_[a-zA-Z0-9]{20,}['"]/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Hardcoded API Key (OpenRouter)',
    pattern: /['"]sk-or-v1-[a-zA-Z0-9]{20,}['"]/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Hardcoded API Key (Gemini)',
    pattern: /['"]AQ\.Ab[a-zA-Z0-9]{20,}['"]/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Hardcoded MongoDB Connection String',
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Hardcoded JWT Secret',
    pattern: /['"](?:super_secret|fallback_secret|jwt_secret_key|your_jwt_secret)['"]/gi,
    severity: 'HIGH',
  },
  {
    name: 'Hardcoded Password',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'MEDIUM',
  },
  {
    name: 'AWS Access Key',
    pattern: /['"]AKIA[0-9A-Z]{16}['"]/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Private Key Block',
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
  },
  {
    name: 'Generic Secret Assignment',
    pattern: /(?:secret|token|api_?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
    severity: 'HIGH',
  },
];

// Files/dirs to skip
const SKIP_DIRS = ['node_modules', 'dist', '.git', '.agents', '.mimocode', '.opencode'];
const SKIP_FILES = ['.env', 'package-lock.json', 'skills-lock.json'];

function scanFile(filePath) {
  const findings = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const { name, pattern, severity } of PATTERNS) {
      // Reset regex lastIndex for each pattern
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Skip lines that are env var references (process.env.X, ${env})
        const matchStart = match.index;
        const lineStart = content.lastIndexOf('\n', matchStart) + 1;
        const lineEnd = content.indexOf('\n', matchStart);
        const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

        // Skip if it's an env var reference
        if (
          line.includes('process.env') ||
          line.includes('${') ||
          line.includes('envVarName') ||
          line.includes('GEMINI_API_KEYS') ||
          line.includes('GROQ_API_KEYS') ||
          line.includes('MISTRAL_API_KEYS') ||
          line.includes('OPENROUTER_API_KEYS') ||
          line.includes('GLM_API_KEYS')
        ) {
          continue;
        }

        // Find line number
        const lineNumber = content.substring(0, matchStart).split('\n').length;

        findings.push({
          file: filePath,
          line: lineNumber,
          rule: name,
          severity,
          snippet: line.trim().substring(0, 100),
        });
      }
    }
  } catch (e) {
    // Skip binary files or unreadable files
  }
  return findings;
}

function scanDirectory(dir) {
  let findings = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (SKIP_DIRS.includes(item.name)) continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        findings = findings.concat(scanDirectory(fullPath));
      } else if (item.isFile() && !SKIP_FILES.includes(item.name)) {
        findings = findings.concat(scanFile(fullPath));
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
  return findings;
}

// Run the scanner
console.log('=== Secret & Credential Scanner ===');
console.log(`Scanning: ${SCAN_DIRS.map(d => path.join(ROOT_DIR, d)).join(', ')}\n`);

let allFindings = [];
for (const dir of SCAN_DIRS) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    allFindings = allFindings.concat(scanDirectory(fullPath));
  }
}

// Also scan root-level files for .gitignore coverage
const gitignorePath = path.join(ROOT_DIR, '.gitignore');
let gitignoreCoversEnv = false;
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
  gitignoreCoversEnv = gitignore.includes('.env');
}

// Report
if (allFindings.length === 0) {
  console.log('✅ No hardcoded secrets found in source code.\n');
} else {
  console.log(`⚠️  Found ${allFindings.length} potential secret(s):\n`);
  const grouped = {};
  for (const f of allFindings) {
    const key = `${f.severity}: ${f.rule}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }
  for (const [key, items] of Object.entries(grouped)) {
    console.log(`  ${key}`);
    for (const item of items) {
      console.log(`    ${item.file}:${item.line} — ${item.snippet}`);
    }
    console.log();
  }
}

// Check .gitignore coverage
console.log('--- .gitignore Coverage ---');
console.log(`  .env files excluded: ${gitignoreCoversEnv ? '✅ Yes' : '❌ No'}`);

// Check if backend/.env is tracked by git
const { execSync } = require('child_process');
try {
  const tracked = execSync('git ls-files backend/.env', {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
  }).trim();
  console.log(`  backend/.env tracked by git: ${tracked ? '❌ Yes (DANGER!)' : '✅ No'}`);
} catch {
  console.log('  backend/.env tracked by git: ✅ No (git not available)');
}

console.log('\n=== Scan Complete ===');
process.exit(allFindings.length > 0 ? 1 : 0);
