import { MongoMemoryServer } from 'mongodb-memory-server';
import * as fs from 'fs';
import * as path from 'path';

const URI_FILE = path.join(__dirname, '.mongo-uri');

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Save URI for setupFiles and test files to read
  fs.writeFileSync(URI_FILE, uri);

  // Also set for child processes
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'e2e_access_secret_32chars_min!';
  process.env.JWT_REFRESH_SECRET = 'e2e_refresh_secret_32chars_min!';
  process.env.CORS_ORIGINS = 'http://localhost:5173';
}
