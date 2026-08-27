export interface ProviderModelConfig {
  model: string;
  api_base?: string;
  api_version?: string;
  fallback_model?: string; // ponytail: second model for same-provider fallback
}

export interface ProviderModels {
  [provider: string]: ProviderModelConfig;
}

// ponytail: all model identifiers live in one file; update here, not in 5 provider files
export const providerModels: ProviderModels = {
  gemini: {
    model: 'gemini-3.5-flash',
    fallback_model: 'gemini-2.5-flash',
    api_version: 'v1',
  },
  glm: {
    model: 'GLM-4.5-Flash',
    fallback_model: 'GLM-4.7-Flash',
    api_base: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  groq: {
    model: 'openai/gpt-oss-20b',
    fallback_model: 'openai/gpt-oss-120b',
  },
  mistral: {
    model: 'mistral-small-latest',
  },
  openrouter: {
    model: 'nvidia/nemotron-3-nano-30b-a3b',
    fallback_model: 'openrouter/free',
  },
};
