import { GeminiProvider } from './ai-service/providers/gemini.provider';
import { GroqProvider } from './ai-service/providers/groq.provider';
import { MistralProvider } from './ai-service/providers/mistral.provider';
import { GLMProvider } from './ai-service/providers/glm.provider';
import { OpenRouterProvider } from './ai-service/providers/openrouter.provider';
import { providerModels } from './ai-service/config/provider-models.config';
import { AbstractLLMProvider } from './ai-service/providers/provider.interface';

const PROVIDERS: Array<{
  name: string;
  factory: () => AbstractLLMProvider;
}> = [
  { name: 'gemini', factory: () => new GeminiProvider() },
  { name: 'groq', factory: () => new GroqProvider() },
  { name: 'mistral', factory: () => new MistralProvider() },
  { name: 'glm', factory: () => new GLMProvider() },
  { name: 'openrouter', factory: () => new OpenRouterProvider() },
];

const PROMPT = 'Reply with the single word OK.';

function getKeys(provider: string): string[] {
  const envVarName = `${provider.toUpperCase()}_API_KEYS`;
  const envVal = process.env[envVarName];
  return (envVal || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

async function testKey(
  providerName: string,
  index: number,
  key: string,
): Promise<{ ok: boolean; detail: string }> {
  const provider = PROVIDERS.find((p) => p.name === providerName)!;
  const model = providerModels[providerName]?.model;
  try {
    const res = await provider.factory().call(model, key, PROMPT);
    if (res.success) {
      return {
        ok: true,
        detail: `OK (in=${res.input_tokens} out=${res.output_tokens})`,
      };
    }
    return { ok: false, detail: `INVALID: ${res.error || 'unknown error'}` };
  } catch (e: any) {
    return { ok: false, detail: `EXCEPTION: ${e?.message || e}` };
  }
}

function shorthand(key: string): string {
  return key.length > 10 ? `${key.slice(0, 6)}...${key.slice(-4)}` : key;
}

async function main() {
  let total = 0;
  let passed = 0;

  for (const p of PROVIDERS) {
    const keys = getKeys(p.name);
    if (keys.length === 0) {
      console.log(
        `— ${p.name}: no keys configured (${p.name.toUpperCase()}_API_KEYS)`,
      );
      continue;
    }
    for (let i = 0; i < keys.length; i++) {
      total++;
      process.stdout.write(
        `  testing [${p.name}#${i + 1}] ${shorthand(keys[i])} ... `,
      );
      const { ok, detail } = await testKey(p.name, i, keys[i]);
      if (ok) {
        passed++;
        console.log('✓');
      } else {
        console.log('✗');
      }
      console.log(`      → ${detail}`);
    }
  }

  if (total === 0) {
    console.log(
      '\nNo provider keys found. Add them to backend/.env, e.g.:\n' +
        'GEMINI_API_KEYS=<key1>,<key2>\nGROQ_API_KEYS=<key1>\nMISTRAL_API_KEYS=<key1>',
    );
    process.exit(1);
  }

  console.log(
    `\nSummary: ${passed}/${total} keys valid.` +
      (passed === total ? ' All keys OK.' : ' Some keys failed.'),
  );
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error('Key test failed:', err);
  process.exit(1);
});
