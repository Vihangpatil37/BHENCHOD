import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Ensures key is exactly 32 bytes from hex string
const getKey = (): Buffer => {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'test') {
      return Buffer.alloc(32, 0); // Dummy key for tests if missing
    }
    throw new Error('FATAL: DB_ENCRYPTION_KEY environment variable is missing.');
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypts a string using AES-256-CBC with a random IV.
 * Use for Mongoose schema setters.
 */
export function encrypt(text: string | null | undefined): string | null | undefined {
  if (text === null || text === undefined || text === '') return text;
  // If it's already encrypted (starts with 32 hex chars + ':'), don't re-encrypt.
  // This is a naive check but works for migrations.
  if (text.length > 33 && text[32] === ':') return text;

  try {
    const iv = randomBytes(16);
    const key = getKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypts a string encrypted with AES-256-CBC.
 * Use for Mongoose schema getters.
 */
export function decrypt(hash: string | null | undefined): string | null | undefined {
  if (hash === null || hash === undefined || hash === '') return hash;
  
  const parts = hash.split(':');
  if (parts.length !== 2) return hash; // Not an encrypted string, return as is

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedHex = parts[1];
    const key = getKey();
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted: string = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed for hash, returning raw:', error);
    return hash; // If decryption fails, return original data
  }
}
