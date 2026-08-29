import * as fs from 'fs';
import * as path from 'path';

// Read URI written by globalSetup.ts (runs before all suites)
const URI_FILE = path.join(__dirname, '.mongo-uri');
if (fs.existsSync(URI_FILE)) {
  process.env.MONGODB_URI = fs.readFileSync(URI_FILE, 'utf-8').trim();
}
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'e2e_access_secret_32chars_min!';
process.env.JWT_REFRESH_SECRET = 'e2e_refresh_secret_32chars_min!';
process.env.CORS_ORIGINS = 'http://localhost:5173';
// Very high throttle limits for E2E tests (each beforeEach does register+login)
process.env.THROTTLE_AUTH_LIMIT = '10000';
process.env.THROTTLE_DEFAULT_LIMIT = '10000';
