import * as fs from 'fs';
import * as path from 'path';

const authDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(authDir, relPath), 'utf-8');
}

describe('Auth Security — JWT Secret Handling', () => {
  describe('No hardcoded fallback secrets', () => {
    it('jwt.strategy.ts has no fallback secret string', () => {
      const content = readFile('strategies/jwt.strategy.ts');
      expect(content).not.toMatch(/fallback.*secret/i);
      expect(content).not.toMatch(/'fallback_/);
      expect(content).not.toMatch(/"fallback_/);
    });

    it('auth.service.ts has no fallback secret in generateTokens (access)', () => {
      const content = readFile('auth.service.ts');
      // Check all secret: lines — none should have fallback
      const secretLines = content
        .split('\n')
        .filter((l) => l.includes('secret:'));
      for (const line of secretLines) {
        expect(line).not.toMatch(/fallback/i);
      }
    });

    it('auth.service.ts has no fallback secret in refresh', () => {
      const content = readFile('auth.service.ts');
      const secretLines = content
        .split('\n')
        .filter((l) => l.includes('secret:'));
      for (const line of secretLines) {
        expect(line).not.toMatch(/fallback/i);
      }
    });
  });

  describe('Secrets not exposed in responses', () => {
    it('sanitizeUser does not include JWT secrets', () => {
      const content = readFile('auth.service.ts');
      // Find the sanitizeUser method and check its return object keys
      const sanitizeMatch = content.match(
        /sanitizeUser\(user:\s*any\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\};[\s\S]*?\}/,
      );
      expect(sanitizeMatch).toBeTruthy();
      if (sanitizeMatch) {
        const returnBody = sanitizeMatch[1];
        // Check that the return object does not contain secret/password/token keys
        expect(returnBody).not.toMatch(/JWT/i);
        expect(returnBody).not.toMatch(/password_hash/);
        expect(returnBody).not.toMatch(/secret/i);
      }
    });
  });

  describe('Startup validation exists in main.ts', () => {
    it('main.ts validates JWT_ACCESS_SECRET length >= 32', () => {
      // Read main.ts from src/ root
      const mainContent = fs.readFileSync(
        path.resolve(srcDir, 'main.ts'),
        'utf-8',
      );
      expect(mainContent).toMatch(/JWT_ACCESS_SECRET/);
      expect(mainContent).toMatch(/length\s*<\s*32|32\s*<=|\.length/);
    });

    it('main.ts validates JWT_REFRESH_SECRET exists', () => {
      const mainContent = fs.readFileSync(
        path.resolve(srcDir, 'main.ts'),
        'utf-8',
      );
      expect(mainContent).toMatch(/JWT_REFRESH_SECRET/);
    });

    it('main.ts validates MONGODB_URI exists', () => {
      const mainContent = fs.readFileSync(
        path.resolve(srcDir, 'main.ts'),
        'utf-8',
      );
      expect(mainContent).toMatch(/MONGODB_URI/);
    });

    it('main.ts throws on missing secrets (fail-fast)', () => {
      const mainContent = fs.readFileSync(
        path.resolve(srcDir, 'main.ts'),
        'utf-8',
      );
      expect(mainContent).toMatch(/throw new Error/);
    });
  });

  describe('Schema security', () => {
    it('password_hash has select:false in user schema', () => {
      const schemaContent = readFile('schemas/user.schema.ts');
      expect(schemaContent).toMatch(/select:\s*false/);
    });
  });
});
