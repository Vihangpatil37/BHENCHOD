import { Test, TestingModule } from '@nestjs/testing';
import { RetryManagerService } from './retry-manager.service';
import { KeyPoolService } from './key-pool.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GLMProvider } from './providers/glm.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { RouteConfig } from './router.service';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AiHealthService } from './ai-health.service';

describe('Career Recommendation Retry Integration (Controlled Reproduction)', () => {
  let service: RetryManagerService;
  let keyPoolService: jest.Mocked<KeyPoolService>;
  let aiHealthService: jest.Mocked<AiHealthService>;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let mistralProvider: jest.Mocked<MistralProvider>;
  let glmProvider: jest.Mocked<GLMProvider>;

  beforeEach(async () => {
    keyPoolService = {
      getKeysForProvider: jest.fn(),
    } as any;
    aiHealthService = {
      isHealthy: jest.fn().mockResolvedValue(true),
      markHealthy: jest.fn().mockResolvedValue(undefined),
      markRateLimited: jest.fn().mockResolvedValue(undefined),
      markInvalid: jest.fn().mockResolvedValue(undefined),
    } as any;
    geminiProvider = { call: jest.fn() } as any;
    mistralProvider = { call: jest.fn() } as any;
    glmProvider = { call: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryManagerService,
        { provide: KeyPoolService, useValue: keyPoolService },
        { provide: AiHealthService, useValue: aiHealthService },
        { provide: GeminiProvider, useValue: geminiProvider },
        { provide: GroqProvider, useValue: {} },
        { provide: MistralProvider, useValue: mistralProvider },
        { provide: GLMProvider, useValue: glmProvider },
        { provide: OpenRouterProvider, useValue: {} },
      ],
    }).compile();

    service = module.get<RetryManagerService>(RetryManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reproduce controlled failure and fallback correctly', async () => {
    keyPoolService.getKeysForProvider.mockImplementation((p) => {
      if (p === 'mistral') return ['mistralA-key', 'mistralB-key'];
      if (p === 'gemini') return ['geminiA-key'];
      if (p === 'glm') return ['glmKeyA-0', 'glmKeyB-1', 'glmKeyC-2'];
      return [];
    });

    const routes: RouteConfig[] = [
      { provider: 'gemini', model: 'gemini-1.5-pro' },
      { provider: 'mistral', model: 'mistral-large-latest' },
      { provider: 'glm', model: 'glm-4-plus' },
    ];

    // Gemini Timeout
    geminiProvider.call.mockRejectedValueOnce({ code: 'ETIMEDOUT' });

    // Mistral key 0 and 1 timeouts
    mistralProvider.call
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' }) // key-0
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' }); // key-1

    // GLM key 0 overloaded, key 1 success
    glmProvider.call
      .mockRejectedValueOnce({ response: { status: 503 } }) // key-0
      .mockResolvedValueOnce({
        success: true,
        data: { recommended_path: 'Software Engineer' },
        input_tokens: 100,
        output_tokens: 50,
      }); // key-1

    const result = await service.executeWithFallback(
      'career_recommendation',
      routes,
      'recommend a career',
      undefined,
      undefined,
      'trace_123',
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('glm');
    expect(result.model).toBe('glm-4-plus');
    expect(result.fallback_used).toBe(true);

    expect(geminiProvider.call).toHaveBeenCalledTimes(1);
    // Mistral should exactly be called 2 times (for keys 0 and 1), and stop
    expect(mistralProvider.call).toHaveBeenCalledTimes(2);
    // GLM should be called 2 times (fails on 0, succeeds on 1)
    expect(glmProvider.call).toHaveBeenCalledTimes(2);
  });
});
