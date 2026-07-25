import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry>();
  private readonly ttlSeconds: number;

  constructor() {
    this.ttlSeconds = parseInt(
      process.env.AI_SERVICE_CACHE_TTL_SECONDS || '3600',
    );
  }

  generateKey(taskType: string, context: Record<string, any>): string {
    const serializedContext = JSON.stringify(context);
    const rawString = `${taskType}:${serializedContext}`;
    return createHash('sha256').update(rawString).digest('hex');
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache key expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.value;
  }

  set(key: string, value: any): void {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
    this.logger.debug(`Cached key: ${key} (expires in ${this.ttlSeconds}s)`);
  }

  clear(): void {
    this.cache.clear();
    this.logger.log('AI Cache cleared');
  }
}
