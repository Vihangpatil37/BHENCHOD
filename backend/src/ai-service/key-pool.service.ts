import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KeyPoolService {
  private readonly logger = new Logger(KeyPoolService.name);
  private keys: Record<string, string[]> = {};
  private indices: Record<string, number> = {};

  constructor() {
    this.loadKeysFromEnv();
  }

  private loadKeysFromEnv() {
    const providers = ['gemini', 'groq', 'mistral', 'glm', 'openrouter'];
    for (const provider of providers) {
      const p = provider.toUpperCase();
      const envVal = 
        process.env[`${p}_API_KEYS`] || 
        process.env[`${p}_API_KEY`] || 
        (provider === 'glm' ? process.env['ZHIPU_API_KEY'] : undefined);

      if (envVal) {
        this.keys[provider] = envVal
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        this.indices[provider] = 0;
        this.logger.log(
          `Loaded ${this.keys[provider].length} keys for provider: ${provider}`,
        );
      } else {
        this.keys[provider] = [];
        this.logger.warn(
          `No API keys found for provider: ${provider} (Env variables: ${p}_API_KEYS / ${p}_API_KEY)`,
        );
      }
    }
  }

  // Get all keys for a provider
  getKeysForProvider(provider: string): string[] {
    const name = provider.toLowerCase();
    return this.keys[name] || [];
  }

  // Get the next key round-robin style (though the retry manager might iterate systematically)
  getNextKey(provider: string): { key: string; index: number } | null {
    const name = provider.toLowerCase();
    const keys = this.keys[name];
    if (!keys || keys.length === 0) {
      return null;
    }
    const idx = this.indices[name] % keys.length;
    this.indices[name]++;
    return {
      key: keys[idx],
      index: idx,
    };
  }
}
