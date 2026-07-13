import { Injectable, Logger } from '@nestjs/common';
import { RouterService } from './router.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CacheService } from './cache.service';
import { RetryManagerService } from './retry-manager.service';
import { JsonValidatorService } from './json-validator.service';
import { TokenLoggerService } from './token-logger.service';

export interface AIResponse<T = any> {
  provider: string;
  model: string;
  task: string;
  success: boolean;
  data: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  latency_ms: number;
  fallback_used: boolean;
  cached: boolean;
}

@Injectable()
export class AIServiceClient {
  private readonly logger = new Logger(AIServiceClient.name);

  constructor(
    private readonly routerService: RouterService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly cacheService: CacheService,
    private readonly retryManagerService: RetryManagerService,
    private readonly jsonValidatorService: JsonValidatorService,
    private readonly tokenLoggerService: TokenLoggerService,
  ) {}

  async run<T = any>(
    taskType: string,
    context: Record<string, any>,
    jsonSchema?: any
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    // 1. Generate cache key and check cache
    const cacheKey = this.cacheService.generateKey(taskType, context);
    const cachedResponse = this.cacheService.get(cacheKey);
    if (cachedResponse) {
      // Return cached response in standard envelope
      return {
        ...cachedResponse,
        cached: true,
        latency_ms: Date.now() - startTime,
      };
    }

    // 2. Load and interpolate prompt
    const { prompt, systemInstruction } = await this.promptBuilderService.build(taskType, context);

    // 3. Resolve routing
    const routes = this.routerService.getRoute(taskType);

    // 4. Execute with retries and fallbacks
    let response: any;
    try {
      response = await this.retryManagerService.executeWithFallback(
        taskType,
        routes,
        prompt,
        systemInstruction,
        jsonSchema
      );
    } catch (e: any) {
      // Log failed request attempt
      await this.tokenLoggerService.log({
        task_type: taskType,
        provider: routes[0]?.provider || 'unknown',
        model: routes[0]?.model || 'unknown',
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: Date.now() - startTime,
        success: false,
        fallback_used: true,
        cached: false,
      });
      throw e;
    }

    // 5. Validate and repair JSON against the schema for this task type
    let finalData = response.data;
    try {
      finalData = this.jsonValidatorService.validateAndRepair(
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        taskType
      );
    } catch (err: any) {
      this.logger.error(`Validation and repair failed: ${err.message}`);
      // Log transaction as failed
      await this.tokenLoggerService.log({
        task_type: taskType,
        provider: response.provider,
        model: response.model,
        input_tokens: response.input_tokens,
        output_tokens: response.output_tokens,
        latency_ms: response.latency_ms,
        success: false,
        fallback_used: response.fallback_used,
        cached: false,
      });
      throw err;
    }

    const finalResponse: AIResponse<T> = {
      provider: response.provider,
      model: response.model,
      task: taskType,
      success: true,
      data: finalData,
      usage: {
        input_tokens: response.input_tokens,
        output_tokens: response.output_tokens,
      },
      latency_ms: response.latency_ms,
      fallback_used: response.fallback_used,
      cached: false,
    };

    // 6. Write log & save to cache
    await this.tokenLoggerService.log({
      task_type: taskType,
      provider: response.provider,
      model: response.model,
      input_tokens: response.input_tokens,
      output_tokens: response.output_tokens,
      latency_ms: response.latency_ms,
      success: true,
      fallback_used: response.fallback_used,
      cached: false,
    });

    this.cacheService.set(cacheKey, finalResponse);

    return finalResponse;
  }
}
