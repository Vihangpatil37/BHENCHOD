import { Injectable } from '@nestjs/common';
import { providerModels } from './config/provider-models.config';

export interface RouteConfig {
  provider: string;
  model: string;
}

@Injectable()
export class RouterService {
  private readonly routes: Record<string, string[]> = {
    career_recommendation: ['gemini', 'groq', 'mistral', 'glm'],
    roadmap_generation: ['gemini', 'gemini', 'groq', 'groq'],
    counselor_chat: [
      'openrouter', // primary
      'openrouter', // fallback 1
      'openrouter', // fallback 2
      'openrouter', // fallback 3
      'openrouter', // fallback 4
      'openrouter', // fallback 5
      'openrouter', // fallback 6
      'openrouter', // fallback 7
      'openrouter', // fallback 8
      'openrouter', // fallback 9
      'openrouter', // fallback 10
      'openrouter', // fallback 11
      'openrouter', // fallback 12
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
