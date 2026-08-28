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
    model: process.env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash',
    fallback_model: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite',
    fallback_models: getEnvList(process.env.GEMINI_FALLBACK_MODELS) || ['gemini-2.5-flash-lite'],
    api_version: 'v1beta',
  },
  glm: {
    model: process.env.GLM_PRIMARY_MODEL || 'GLM-4.7-Flash',
    fallback_model: process.env.GLM_FALLBACK_MODEL || 'GLM-4.5-Flash',
    fallback_models: getEnvList(process.env.GLM_FALLBACK_MODELS) || ['GLM-4.5-Flash'],
    api_base: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  groq: {
    model: process.env.GROQ_PRIMARY_MODEL || 'llama-3.3-70b-versatile',
    fallback_model: process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant',
    fallback_models: getEnvList(process.env.GROQ_FALLBACK_MODELS) || ['llama-3.1-8b-instant'],
  },
  mistral: {
    model: process.env.MISTRAL_PRIMARY_MODEL || 'mistral-large-latest',
    fallback_models: getEnvList(process.env.MISTRAL_FALLBACK_MODELS) || [],
  },
  openrouter: {
    model: process.env.OPENROUTER_PRIMARY_MODEL || 'openai/gpt-oss-120b:free',
    fallback_model: process.env.OPENROUTER_FALLBACK_MODEL || 'openai/gpt-oss-20b:free',
    fallback_models: getEnvList(process.env.OPENROUTER_FALLBACK_MODELS) || [
      'openai/gpt-oss-20b:free',
      'deepseek/deepseek-r1:free',
      'qwen/qwen3-coder:free',
      'google/gemma-3-27b-it:free',
      'z-ai/glm-5.2:free',
    ],
  },
};

