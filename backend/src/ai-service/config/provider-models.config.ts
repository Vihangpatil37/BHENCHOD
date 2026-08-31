import * as dotenv from 'dotenv';
dotenv.config();

export interface ProviderModelConfig {
  model: string;
  api_base?: string;
  api_version?: string;
  fallback_model?: string; // Legacy single fallback for same-provider
  fallback_models?: string[]; // ponytail: multi-tier same-provider fallbacks
}

export interface ProviderModels {
  [provider: string]: ProviderModelConfig;
}

const getEnvList = (val?: string): string[] | undefined => {
  if (!val) return undefined;
  return val.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
};

// ponytail: all model identifiers live in one file; update here, not in 5 provider files
export const providerModels: ProviderModels = {
  gemini: {
    model: process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.7-flash',
    fallback_model: process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.6-flash',
    fallback_models: getEnvList(process.env.GEMINI_FALLBACK_MODELS) || ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'],
    api_version: 'v1beta',
  },
  glm: {
    model: process.env.GLM_PRIMARY_MODEL || 'GLM-5',
    fallback_model: process.env.GLM_FALLBACK_MODEL || 'GLM-5.3-Flash',
    fallback_models: getEnvList(process.env.GLM_FALLBACK_MODELS) || ['GLM-5.3-Flash', 'GLM-5.2', 'GLM-5.1'],
    api_base: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  groq: {
    model: process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
    fallback_model: process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b',
    fallback_models: getEnvList(process.env.GROQ_FALLBACK_MODELS) || ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  mistral: {
    model: process.env.MISTRAL_PRIMARY_MODEL || 'mistral-small-latest',
    fallback_models: getEnvList(process.env.MISTRAL_FALLBACK_MODELS) || ['ministral-3-14b-latest', 'ministral-3-8b-latest', 'ministral-3-3b-latest'],
  },
  openrouter: {
    model: process.env.OPENROUTER_PRIMARY_MODEL || 'z-ai/glm-5.2:free',
    fallback_model: process.env.OPENROUTER_FALLBACK_MODEL || 'minimax/minimax-m2.7:free',
    fallback_models: getEnvList(process.env.OPENROUTER_FALLBACK_MODELS) || [
      'minimax/minimax-m2.7:free',
      'nvidia/nemotron-3-ultra:free',
      'meta-llama/llama-3-8b-instruct:free'
    ],
  },
};

