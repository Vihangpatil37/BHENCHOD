import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import { AbstractLLMProvider, ProviderResponse } from './providers/provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GLMProvider } from './providers/glm.provider';
import { RouteConfig } from './router.service';
import { EventEmitter } from 'events';

// Create a simple event emitter for cross-module events (e.g. analytics)
export const aiServiceEvents = new EventEmitter();

@Injectable()
export class RetryManagerService {
  private readonly logger = new Logger(RetryManagerService.name);
  private readonly providers: Record<string, AbstractLLMProvider> = {};

  constructor(
    private readonly keyPoolService: KeyPoolService,
    gemini: GeminiProvider,
    groq: GroqProvider,
    mistral: MistralProvider,
    deepseek: DeepSeekProvider,
    glm: GLMProvider,
  ) {
    this.providers['gemini'] = gemini;
    this.providers['groq'] = groq;
    this.providers['mistral'] = mistral;
    this.providers['deepseek'] = deepseek;
    this.providers['glm'] = glm;
  }

  // ponytail: matches quota/billing errors that won't resolve with key rotation
  private isQuotaError(error?: string): boolean {
    if (!error) return false;
    const lower = error.toLowerCase();
    return (
      lower.includes('insufficient_balance') ||
      lower.includes('insufficient_quota') ||
      lower.includes('quota exceeded') ||
      lower.includes('rate limit') ||
      lower.includes('429') ||
      error.includes('402')
    );
  }

  async executeWithFallback(
    taskType: string,
    routes: RouteConfig[],
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any
  ): Promise<{
    provider: string;
    model: string;
    success: boolean;
    data: any;
    input_tokens: number;
    output_tokens: number;
    fallback_used: boolean;
    latency_ms: number;
  }> {
    const startTime = Date.now();
    let fallbackUsed = false;
    const unhealthyReported = new Set<string>();

    // Loop through providers/models sequentially
    for (let r = 0; r < routes.length; r++) {
      const route = routes[r];
      const providerInstance = this.providers[route.provider];

      if (!providerInstance) {
        this.logger.warn(`Provider adapter not found: ${route.provider}`);
        continue;
      }

      const keys = this.keyPoolService.getKeysForProvider(route.provider);
      if (keys.length === 0) {
        this.logger.warn(`No keys available for provider: ${route.provider}`);
        continue;
      }

      if (r > 0) {
        fallbackUsed = true;
        aiServiceEvents.emit('AI_PROVIDER_FALLBACK_TRIGGERED', {
          task_type: taskType,
          escalated_to_provider: route.provider,
          escalated_to_model: route.model,
          timestamp: new Date().toISOString(),
        });
      }

      let quotaExhausted = false;

      // Try keys sequentially within the provider
      for (let k = 0; k < keys.length; k++) {
        if (quotaExhausted) break; // ponytail: skip remaining keys on quota error

        const apiKey = keys[k];
        const attemptStartTime = Date.now();

        this.logger.log(
          `Executing AI call: task=${taskType}, provider=${route.provider}, model=${route.model}, key_index=${k}/${keys.length - 1}`
        );

        const response: ProviderResponse = await providerInstance.call(
          route.model,
          apiKey,
          prompt,
          systemInstruction,
          jsonSchema
        );

        const latency = Date.now() - attemptStartTime;

        if (response.success) {
          return {
            provider: route.provider,
            model: route.model,
            success: true,
            data: response.data,
            input_tokens: response.input_tokens,
            output_tokens: response.output_tokens,
            fallback_used: fallbackUsed,
            latency_ms: Date.now() - startTime,
          };
        }

        this.logger.error(
          `AI Call failed (provider=${route.provider}, model=${route.model}, key_index=${k}): ${response.error || 'Unknown error'}`
        );

        if (this.isQuotaError(response.error)) {
          quotaExhausted = true;
          if (!unhealthyReported.has(route.provider)) {
            unhealthyReported.add(route.provider);
            aiServiceEvents.emit('AI_PROVIDER_UNHEALTHY_DETECTED', {
              provider: route.provider,
              model: route.model,
              reason: response.error,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    throw new HttpException(
      {
        message: 'AI Service failed. All configured LLM providers and key attempts were exhausted.',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}
