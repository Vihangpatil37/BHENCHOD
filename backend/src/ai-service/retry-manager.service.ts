import { Injectable, Logger } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import {
  AbstractLLMProvider,
  ProviderResponse,
} from './providers/provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GLMProvider } from './providers/glm.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { RouteConfig } from './router.service';
import { EventEmitter } from 'events';
import {
  AttemptPlanItem,
  RetryContext,
  RetryExecutionResult,
} from './types/retry.types';
import { AIServiceExhaustedError } from './errors/ai-service-exhausted.error';
import { classifyAIError, getRetryPolicy } from './utils/error-classifier';

// Create a simple event emitter for cross-module events (e.g. analytics)
export const aiServiceEvents = new EventEmitter();

@Injectable()
export class RetryManagerService {
  private readonly logger = new Logger(RetryManagerService.name);
  private readonly providers: Record<string, AbstractLLMProvider> = {};

  // Global settings
  private readonly AI_GLOBAL_TIMEOUT_MS = 60000;
  private readonly AI_SERVICE_DEFAULT_TIMEOUT_MS = 15000;
  private readonly AI_MAX_ATTEMPTS = 10;

  constructor(
    private readonly keyPoolService: KeyPoolService,
    gemini: GeminiProvider,
    groq: GroqProvider,
    mistral: MistralProvider,
    glm: GLMProvider,
    openrouter: OpenRouterProvider,
  ) {
    this.providers['gemini'] = gemini;
    this.providers['groq'] = groq;
    this.providers['mistral'] = mistral;
    this.providers['glm'] = glm;
    this.providers['openrouter'] = openrouter;
  }

  public buildAttemptPlan(routes: RouteConfig[]): AttemptPlanItem[] {
    const plan: AttemptPlanItem[] = [];

    for (const route of routes) {
      const keys = this.keyPoolService.getKeysForProvider(route.provider);
      if (keys.length === 0) continue;

      for (let k = 0; k < keys.length; k++) {
        plan.push({
          provider: route.provider,
          model: route.model,
          keyIndex: k,
          totalKeysForProvider: keys.length,
          apiKey: keys[k],
        });
      }
    }

    return plan;
  }

  async executeWithFallback(
    taskType: string,
    routes: RouteConfig[],
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any,
    traceId: string = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  ): Promise<RetryExecutionResult> {
    const plan = this.buildAttemptPlan(routes);

    if (plan.length === 0) {
      throw new AIServiceExhaustedError(
        traceId,
        taskType,
        0,
        [],
        'No providers or API keys available to execute the request.',
      );
    }

    const context: RetryContext = {
      traceId,
      task: taskType,
      attempt: 0,
      maxAttempts: this.AI_MAX_ATTEMPTS,
      provider: plan[0].provider,
      model: plan[0].model,
      keyIndex: plan[0].keyIndex,
      totalKeys: plan.length,
      startedAt: Date.now(),
      deadline: Date.now() + this.AI_GLOBAL_TIMEOUT_MS,
      history: [],
    };

    let fallbackUsed = false;
    let initialProvider = plan[0].provider;

    for (let i = 0; i < plan.length; i++) {
      const currentPlan = plan[i];

      // Update context for the current attempt
      context.attempt++;
      context.provider = currentPlan.provider;
      context.model = currentPlan.model;
      context.keyIndex = currentPlan.keyIndex;

      if (currentPlan.provider !== initialProvider) {
        fallbackUsed = true;
        aiServiceEvents.emit('AI_PROVIDER_FALLBACK_TRIGGERED', {
          traceId,
          task_type: taskType,
          escalated_to_provider: currentPlan.provider,
          escalated_to_model: currentPlan.model,
          timestamp: new Date().toISOString(),
        });
        initialProvider = currentPlan.provider; // Prevents spamming this event for same provider keys
      }

      const remainingBudget = context.deadline - Date.now();
      if (remainingBudget <= 0) {
        throw new AIServiceExhaustedError(
          traceId,
          taskType,
          context.attempt,
          context.history,
          'Global timeout deadline exceeded.',
        );
      }

      if (context.attempt > context.maxAttempts) {
        throw new AIServiceExhaustedError(
          traceId,
          taskType,
          context.attempt,
          context.history,
          'Global maximum attempts exceeded.',
        );
      }

      const attemptTimeout = Math.min(this.AI_SERVICE_DEFAULT_TIMEOUT_MS, remainingBudget);

      const providerInstance = this.providers[currentPlan.provider];
      if (!providerInstance) {
        // Should not happen, but safe fallback
        continue;
      }

      this.logger.log(
        `[AI_ATTEMPT_START] trace=${traceId} task=${taskType} attempt=${context.attempt}/${context.maxAttempts} provider=${currentPlan.provider} model=${currentPlan.model} key=${currentPlan.keyIndex + 1}/${currentPlan.totalKeysForProvider}`,
      );

      const attemptStartTime = Date.now();
      let response: ProviderResponse;

      try {
        response = await providerInstance.call(
          currentPlan.model,
          currentPlan.apiKey,
          prompt,
          systemInstruction,
          jsonSchema,
          attemptTimeout,
        );
      } catch (err: any) {
        // If the provider threw an unhandled error instead of returning ProviderResponse
        response = {
          success: false,
          data: null,
          input_tokens: 0,
          output_tokens: 0,
          error: err.message,
          rawError: err,
          statusCode: err.response?.status,
        };
      }

      const durationMs = Date.now() - attemptStartTime;

      if (response.success) {
        this.logger.log(
          `[AI_ATTEMPT_SUCCESS] trace=${traceId} task=${taskType} attempt=${context.attempt}/${context.maxAttempts} provider=${currentPlan.provider} model=${currentPlan.model} key=${currentPlan.keyIndex + 1}/${currentPlan.totalKeysForProvider} duration=${durationMs}ms tokens_in=${response.input_tokens} tokens_out=${response.output_tokens}`,
        );
        this.logger.log(
          `[AI_REQUEST_COMPLETE] trace=${traceId} task=${taskType} status=SUCCESS total_attempts=${context.attempt} total_duration=${Date.now() - context.startedAt}ms`,
        );

        context.history.push({
          provider: currentPlan.provider,
          model: currentPlan.model,
          keyIndex: currentPlan.keyIndex,
          totalKeys: currentPlan.totalKeysForProvider,
          startedAt: attemptStartTime,
          durationMs,
          success: true,
        });

        return {
          provider: currentPlan.provider,
          model: currentPlan.model,
          success: true,
          data: response.data,
          input_tokens: response.input_tokens,
          output_tokens: response.output_tokens,
          fallback_used: fallbackUsed,
          latency_ms: Date.now() - context.startedAt,
        };
      }

      // Handle Failure
      const errorCategory = classifyAIError(
        response.rawError || { message: response.error, statusCode: response.statusCode },
      );
      
      this.logger.error(
        `[AI_ATTEMPT_FAILED] trace=${traceId} task=${taskType} attempt=${context.attempt}/${context.maxAttempts} provider=${currentPlan.provider} model=${currentPlan.model} key=${currentPlan.keyIndex + 1}/${currentPlan.totalKeysForProvider} error=${errorCategory} duration=${durationMs}ms message="${response.error}"`,
      );

      context.history.push({
        provider: currentPlan.provider,
        model: currentPlan.model,
        keyIndex: currentPlan.keyIndex,
        totalKeys: currentPlan.totalKeysForProvider,
        startedAt: attemptStartTime,
        durationMs,
        success: false,
        errorCategory,
        errorMessage: response.error,
        statusCode: response.statusCode,
      });

      const policy = getRetryPolicy(errorCategory);

      if (!policy.nextKey) {
        // Skip remaining keys for this provider
        while (i + 1 < plan.length && plan[i + 1].provider === currentPlan.provider) {
          i++;
        }
      }

      if (!policy.nextProvider) {
        throw new AIServiceExhaustedError(
          traceId,
          taskType,
          context.attempt,
          context.history,
          `Request failed with unretryable error: ${errorCategory} - ${response.error}`,
        );
      }
    }

    this.logger.error(
      `[AI_REQUEST_COMPLETE] trace=${traceId} task=${taskType} status=EXHAUSTED total_attempts=${context.attempt} total_duration=${Date.now() - context.startedAt}ms`,
    );

    throw new AIServiceExhaustedError(
      traceId,
      taskType,
      context.attempt,
      context.history,
    );
  }
}
