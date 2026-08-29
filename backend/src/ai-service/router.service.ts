import { Injectable } from '@nestjs/common';
import { providerModels } from './config/provider-models.config';

export interface RouteConfig {
  provider: string;
  model: string;
}

@Injectable()
export class RouterService {
  private readonly routes: Record<string, string[]> = {
    career_recommendation: ['gemini', 'gemini', 'groq', 'groq'],
    roadmap_generation: ['gemini', 'gemini', 'groq', 'groq'],
    counselor_chat: [
      'openrouter', // primary (GPT-OSS 120B)
      'openrouter', // fallback 1 (GPT-OSS 20B)
      'openrouter', // fallback 2 (DeepSeek R1)
      'openrouter', // fallback 3 (Qwen3 Coder)
      'groq',       // Llama 3.3
      'groq',       // Llama 3.1
      'gemini',     // Gemini 2.5 Flash
      'gemini',     // Gemini 2.5 Flash-Lite
      'glm',        // GLM 4.7
      'glm',        // GLM 4.5
    ],
    career_trait_backfill: ['gemini', 'gemini', 'groq', 'groq'],
    report_summary: ['mistral', 'gemini', 'gemini', 'groq', 'groq'],
    scenario_generation: ['gemini', 'gemini', 'groq', 'groq'],
    test_task: ['groq', 'groq', 'gemini', 'gemini'],
  };

  getRoute(taskType: string): RouteConfig[] {
    const providers = this.routes[taskType];
    if (!providers) {
      return [
        { provider: 'gemini', model: providerModels.gemini.model },
        { provider: 'groq', model: providerModels.groq.model },
      ];
    }
    
    // ponytail: track consecutive usage count of each provider in the route
    const providerCounts: Record<string, number> = {};

    return providers.map((p) => {
      const cfg = providerModels[p];
      const count = providerCounts[p] || 0;
      providerCounts[p] = count + 1;

      let model = cfg.model;
      if (count > 0) {
        if (cfg.fallback_models && cfg.fallback_models.length >= count) {
          model = cfg.fallback_models[count - 1];
        } else if (cfg.fallback_model) {
          model = cfg.fallback_model;
        }
      }
      return { provider: p, model };
    });
  }
}
