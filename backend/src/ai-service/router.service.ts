import { Injectable } from '@nestjs/common';
import { providerModels } from './config/provider-models.config';

export interface RouteConfig {
  provider: string;
  model: string;
}

export interface TaskConfig {
  taskType: string;
  maxAttempts: number;
  routes: RouteConfig[];
}

@Injectable()
export class RouterService {
  private getProviderRoutes(providers: string[]): RouteConfig[] {
    const routes: RouteConfig[] = [];
    for (const p of providers) {
      const cfg = providerModels[p];
      if (!cfg) continue;

      routes.push({ provider: p, model: cfg.model });
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

  getTaskConfig(taskType: string): TaskConfig {
    if (taskType === 'counselor_chat' || taskType.startsWith('counselor')) {
      return {
        taskType,
        maxAttempts: 5,
        routes: this.getProviderRoutes(['gemini', 'openrouter', 'groq', 'mistral', 'glm']), // Fast models first, then full cascade
      };
    } else if (taskType === 'recommendation' || taskType.startsWith('recommendation')) {
      return {
        taskType,
        maxAttempts: 8,
        routes: this.getProviderRoutes(['gemini', 'openrouter', 'groq', 'mistral', 'glm']), // Deep reasoning for recommendations
      };
    }
    
    // Default fallback
    return {
      taskType,
      maxAttempts: 6,
      routes: this.getProviderRoutes(['gemini', 'groq', 'mistral', 'openrouter', 'glm']),
    };
  }
}
