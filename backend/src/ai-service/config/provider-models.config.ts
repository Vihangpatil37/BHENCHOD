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
    model: 'gemini-1.5-flash',
    fallback_model: 'gemini-1.5-flash-8b',
    api_version: 'v1beta',
  },
  glm: {
    model: 'GLM-4.7-Flash',
    fallback_model: 'GLM-4.5-Flash',
    api_base: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  groq: {
    model: 'llama3-8b-8192',
    fallback_model: 'mixtral-8x7b-32768',
  },
  mistral: {
    model: 'mistral-large-latest',
  },
  openrouter: {
    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    fallback_model: 'google/gemma-2-9b-it:free',
  },
};
