import { Injectable } from '@nestjs/common';

export interface RouteConfig {
  provider: string;
  model: string;
}

@Injectable()
export class RouterService {
  private readonly routes: Record<string, RouteConfig[]> = {
    career_recommendation: [
      { provider: 'gemini', model: 'gemini-2.5-pro' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    ],
    roadmap_generation: [
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    ],
    counselor_chat: [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'groq', model: 'mixtral-8x7b-32768' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
    ],
    career_trait_backfill: [
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
    ],
    report_summary: [
      { provider: 'mistral', model: 'mistral-large-latest' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    ],
    test_task: [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
    ],
  };

  getRoute(taskType: string): RouteConfig[] {
    const route = this.routes[taskType];
    if (!route) {
      // Default fallback routing if task type is unknown
      return [
        { provider: 'gemini', model: 'gemini-2.5-flash' },
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      ];
    }
    return route;
  }
}
