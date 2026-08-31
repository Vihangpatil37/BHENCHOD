import { Injectable } from '@nestjs/common';
import { providerModels } from './config/provider-models.config';

export interface RouteConfig {
  provider: string;
  model: string;
}

@Injectable()
export class RouterService {
  // Unified universal routing: attempt gemini, then openrouter, then groq, then mistral, then glm for ALL tasks
  private readonly universalSequence = ['gemini', 'openrouter', 'groq', 'mistral', 'glm'];

  getRoute(taskType: string): RouteConfig[] {
    const providers = this.universalSequence;
    const routes: RouteConfig[] = [];

    for (const p of providers) {
      const cfg = providerModels[p];
      if (!cfg) continue;

      // 1. Add primary model
      routes.push({ provider: p, model: cfg.model });

      // 2. Add fallback models if they exist
      if (cfg.fallback_models && cfg.fallback_models.length > 0) {
        for (const fbModel of cfg.fallback_models) {
          routes.push({ provider: p, model: fbModel });
        }
      } else if (cfg.fallback_model) {
        routes.push({ provider: p, model: cfg.fallback_model });
      }
    }

    return routes;
  }
}
