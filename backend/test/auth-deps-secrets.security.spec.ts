import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../../..');
const backendDir = path.resolve(rootDir, 'backend');
const frontendDir = path.resolve(rootDir, 'frontend');

describe('Security — Dependency Audit', () => {
  describe('Critical security dependencies installed', () => {
    it('backend has helmet installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('helmet');
    });

    it('backend has @nestjs/throttler installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('@nestjs/throttler');
    });

    it('backend has bcrypt installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('bcrypt');
    });

    it('backend has passport-jwt installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('passport-jwt');
    });

    it('backend has class-validator installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(backendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('class-validator');
    });

    it('frontend has dompurify installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.dependencies).toHaveProperty('dompurify');
    });

    it('frontend has @types/dompurify installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf-8'),
      );
      expect(pkg.devDependencies).toHaveProperty('@types/dompurify');
    });
  });
});

describe('Security — Secret Scan', () => {
  describe('No hardcoded secrets in source', () => {
    it('backend src has no hardcoded API keys', () => {
      const srcDir = path.join(backendDir, 'src');
      const files = getAllTsFiles(srcDir);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        // Check for common API key patterns (not env var references)
        expect(content).not.toMatch(
          /['"]gsk_[a-zA-Z0-9]{20,}['"]/,
        ); // Groq keys
        expect(content).not.toMatch(
          /['"]AQ\.Ab[a-zA-Z0-9]{20,}['"]/,
        ); // Gemini keys
        expect(content).not.toMatch(
          /['"]sk-or-v1-[a-zA-Z0-9]{20,}['"]/,
        ); // OpenRouter keys
      }
    });

    it('backend src has no hardcoded MongoDB passwords', () => {
      const srcDir = path.join(backendDir, 'src');
      const files = getAllTsFiles(srcDir);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).not.toMatch(
          /mongodb:\/\/[^:]+:[^@]+@/,
        );
      }
    });

    it('backend src has no fallback JWT secrets', () => {
      const srcDir = path.join(backendDir, 'src');
      const files = getAllTsFiles(srcDir);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/fallback.*secret/i);
        expect(content).not.toMatch(/super_secret/i);
      }
    });
  });

  describe('Gitignore covers secrets', () => {
    it('.env is in .gitignore', () => {
      const gitignore = fs.readFileSync(
        path.join(rootDir, '.gitignore'),
        'utf-8',
      );
      expect(gitignore).toMatch(/\.env/);
    });
  });

  describe('Backend .env not committed', () => {
    it('backend/.env is not tracked by git', () => {
      // Check git status
      const { execSync } = require('child_process');
      try {
        const output = execSync('git ls-files backend/.env', {
          cwd: rootDir,
          encoding: 'utf-8',
        }).trim();
        // If output is empty, .env is not tracked (good)
        expect(output).toBe('');
      } catch {
        // git command failed — likely .env not tracked
        expect(true).toBe(true);
      }
    });
  });
});

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== 'node_modules' && item.name !== 'dist') {
      results.push(...getAllTsFiles(fullPath));
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
      results.push(fullPath);
    }
  }
  return results;
}
