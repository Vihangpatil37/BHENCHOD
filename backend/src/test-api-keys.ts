import axios from 'axios';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ProviderConfig {
  test: (key: string) => Promise<boolean>;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    test: async (key) => {
      const res = await axios.get('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 10000,
      });
      return res.status === 200;
    },
  },
  gemini: {
    test: async (key) => {
      const res = await axios.get('https://generativelanguage.googleapis.com/v1/models', {
        params: { key },
        timeout: 10000,
      });
      return res.status === 200;
    },
  },
  mistral: {
    test: async (key) => {
      const res = await axios.get('https://api.mistral.ai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 10000,
      });
      return res.status === 200;
    },
  },
  glm: {
    test: async (key) => {
      const res = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        { model: 'glm-4-flash', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
        { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 10000 },
      );
      return res.status === 200;
    },
  },
};

function loadEnv(): Record<string, string> {
  const envPath = resolve(__dirname, '../.env');
  const text = readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  let passed = 0;
  let failed = 0;

  console.log('Testing API keys...\n');

  for (const [provider, config] of Object.entries(PROVIDERS)) {
    const keyStr = env[`${provider.toUpperCase()}_API_KEYS`];
    if (!keyStr) {
      console.log(`[${provider}] SKIP (no keys configured)`);
      continue;
    }
    const keys = keyStr.split(',').map((k) => k.trim()).filter(Boolean);
    console.log(`[${provider}] ${keys.length} key(s):`);

    const results = await Promise.allSettled(
      keys.map(async (key, i) => {
        const masked = key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-4)}` : key;
        try {
          const ok = await config.test(key);
          console.log(`  ${i + 1}. ${masked}  ${ok ? 'PASS' : 'FAIL'}`);
          if (ok) passed++;
          else failed++;
        } catch (err: any) {
          const status = err?.response?.status ?? err?.code ?? 'ERR';
          console.log(`  ${i + 1}. ${masked}  FAIL (${status})`);
          failed++;
        }
      }),
    );
  }

  const total = passed + failed;
  console.log(`\n---\n${passed}/${total} passed, ${failed}/${total} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
