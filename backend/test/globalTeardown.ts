import * as fs from 'fs';
import * as path from 'path';

const URI_FILE = path.join(__dirname, '.mongo-uri');

export default async function globalTeardown() {
  // Clean up the URI file
  if (fs.existsSync(URI_FILE)) {
    fs.unlinkSync(URI_FILE);
  }
}
