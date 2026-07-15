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
    model: 'gemini-2.5-flash',
    api_version: 'v1',
  },
  glm: {
    model: 'glm-4.7-flash',
    api_base: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  groq: {
    model: 'llama-3.3-70b-versatile',
    fallback_model: 'mixtral-8x7b-32768',
  },
  mistral: {
    model: 'mistral-large-latest',
  },
};
