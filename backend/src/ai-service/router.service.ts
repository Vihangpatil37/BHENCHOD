import { Injectable } from '@nestjs/common';
import { providerModels } from './config/provider-models.config';

export interface RouteConfig {
  provider: string;
  model: string;
}

@Injectable()
export class RouterService {
  private readonly routes: Record<string, string[]> = {
    career_recommendation: ['gemini', 'groq'],
    roadmap_generation: ['gemini', 'groq'],
    counselor_chat: ['openrouter', 'groq', 'groq', 'gemini', 'glm', 'glm'],
    career_trait_backfill: ['gemini', 'groq', 'groq'],
    report_summary: ['mistral', 'gemini', 'groq'],
    scenario_generation: ['gemini', 'groq'],
    test_task: ['groq', 'gemini'],
  };

  getRoute(taskType: string): RouteConfig[] {
    const providers = this.routes[taskType];
    if (!providers) {
      return [
        { provider: 'gemini', model: providerModels.gemini.model },
        { provider: 'groq', model: providerModels.groq.model },
      ];
    }
    // ponytail: consecutive same-provider entries use fallback_model
    return providers.map((p, i) => {
      const cfg = providerModels[p];
      const model =
        i > 0 && providers[i - 1] === p && cfg.fallback_model
          ? cfg.fallback_model
          : cfg.model;
      return { provider: p, model };
    });
  }
}
