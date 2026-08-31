import { Test, TestingModule } from '@nestjs/testing';
import { RetryManagerService } from './retry-manager.service';
import { KeyPoolService } from './key-pool.service';
import { AiHealthService } from './ai-health.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GLMProvider } from './providers/glm.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { RouteConfig } from './router.service';
import { AIServiceExhaustedError } from './errors/ai-service-exhausted.error';

describe('RetryManagerService', () => {
  let service: RetryManagerService;
  let keyPoolService: jest.Mocked<KeyPoolService>;
  let aiHealthService: jest.Mocked<AiHealthService>;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let openRouterProvider: jest.Mocked<OpenRouterProvider>;

  beforeEach(async () => {
    keyPoolService = {
      getKeysForProvider: jest.fn(),
      getNextKey: jest.fn(),
    } as any;

    aiHealthService = {
      isHealthy: jest.fn().mockResolvedValue(true),
      markHealthy: jest.fn().mockResolvedValue(undefined),
      markRateLimited: jest.fn().mockResolvedValue(undefined),
      markInvalid: jest.fn().mockResolvedValue(undefined),
    } as any;

    geminiProvider = {
      call: jest.fn(),
    } as any;

    openRouterProvider = {
      call: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryManagerService,
        { provide: KeyPoolService, useValue: keyPoolService },
        { provide: AiHealthService, useValue: aiHealthService },
        { provide: GeminiProvider, useValue: geminiProvider },
        { provide: GroqProvider, useValue: {} },
        { provide: MistralProvider, useValue: {} },
        { provide: GLMProvider, useValue: {} },
        { provide: OpenRouterProvider, useValue: openRouterProvider },
      ],
    }).compile();

    service = module.get<RetryManagerService>(RetryManagerService);
  });

  describe('buildAttemptPlan', () => {
    it('should deduplicate attempts with same provider, model, and key', () => {
      keyPoolService.getKeysForProvider.mockReturnValue(['key1']);
      
      const routes: RouteConfig[] = [
        { provider: 'gemini', model: 'model-a' },
        { provider: 'gemini', model: 'model-a' }, // Duplicate!
      ];

      const plan = service.buildAttemptPlan(routes);
      
      expect(plan.length).toBe(1);
      expect(plan[0].provider).toBe('gemini');
      expect(plan[0].model).toBe('model-a');
    });
  });

  describe('executeWithFallback', () => {
    const routes: RouteConfig[] = [
      { provider: 'gemini', model: 'gemini-model' },
      { provider: 'openrouter', model: 'or-model' }
    ];

    it('should select second healthy key if first is rate limited', async () => {
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['key1', 'key2'];
        return [];
      });

      // Key 1 Rate limited
      geminiProvider.call.mockRejectedValueOnce({
        response: { status: 429 },
        message: 'Rate limit exceeded',
      });

      // Key 2 Success
      geminiProvider.call.mockResolvedValueOnce({
        success: true,
        data: 'success-data',
        input_tokens: 10,
        output_tokens: 10,
      } as any);

      const result = await service.executeWithFallback('test', routes, 'prompt');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success-data');
      expect(geminiProvider.call).toHaveBeenCalledTimes(2);
      expect(geminiProvider.call).toHaveBeenNthCalledWith(1, 'gemini-model', 'key1', 'prompt', undefined, undefined, expect.any(Number));
      expect(geminiProvider.call).toHaveBeenNthCalledWith(2, 'gemini-model', 'key2', 'prompt', undefined, undefined, expect.any(Number));
    });

    it('should skip unhealthy keys without consuming maxAttempts budget', async () => {
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['key1', 'key2', 'key3'];
        return [];
      });

      // Mark first two keys unhealthy
      aiHealthService.isHealthy.mockImplementation(async (provider, keyPrefix) => {
        if (keyPrefix === 'key1'.substring(0, 8)) return false;
        if (keyPrefix === 'key2'.substring(0, 8)) return false;
        return true;
      });

      geminiProvider.call.mockResolvedValueOnce({
        success: true,
        data: 'success-data',
      } as any);

      // maxAttempts is strictly 1. We skip 2 keys. If budget was consumed, it would fail.
      const result = await service.executeWithFallback('test', routes, 'prompt', undefined, undefined, 1);
      
      expect(result.success).toBe(true);
      expect(geminiProvider.call).toHaveBeenCalledTimes(1);
      expect(geminiProvider.call).toHaveBeenCalledWith('gemini-model', 'key3', 'prompt', undefined, undefined, expect.any(Number));
    });

    it('should fallback to next provider if Gemini keys are exhausted', async () => {
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['key1', 'key2'];
        if (provider === 'openrouter') return ['or-key1'];
        return [];
      });

      // Both Gemini keys rate limited
      geminiProvider.call.mockRejectedValue({
        response: { status: 429 },
        message: 'Rate limit',
      });

      // OpenRouter success
      openRouterProvider.call.mockResolvedValueOnce({
        success: true,
        data: 'or-data',
      } as any);

      const result = await service.executeWithFallback('test', routes, 'prompt');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('openrouter');
      expect(result.fallback_used).toBe(true);
      
      expect(geminiProvider.call).toHaveBeenCalledTimes(2);
      expect(openRouterProvider.call).toHaveBeenCalledTimes(1);
    });

    it('should rotate keys correctly on TIMEOUT instead of endlessly retrying the same key', async () => {
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['key1', 'key2'];
        return [];
      });

      // Key 1 Timeout
      geminiProvider.call.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      });

      // Key 2 Success
      geminiProvider.call.mockResolvedValueOnce({
        success: true,
        data: 'timeout-success',
      } as any);

      const result = await service.executeWithFallback('test', routes, 'prompt');
      
      expect(result.success).toBe(true);
      expect(geminiProvider.call).toHaveBeenCalledTimes(2);
      expect(geminiProvider.call).toHaveBeenNthCalledWith(1, 'gemini-model', 'key1', 'prompt', undefined, undefined, expect.any(Number));
      expect(geminiProvider.call).toHaveBeenNthCalledWith(2, 'gemini-model', 'key2', 'prompt', undefined, undefined, expect.any(Number));
    });

    it('should respect global maxAttempts even across fallback providers', async () => {
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['key1', 'key2'];
        if (provider === 'openrouter') return ['or-key1'];
        return [];
      });

      geminiProvider.call.mockRejectedValue({
        response: { status: 500 },
        message: 'Server error',
      });

      openRouterProvider.call.mockRejectedValue({
        response: { status: 500 },
        message: 'Server error',
      });

      await expect(
        service.executeWithFallback('test', routes, 'prompt', undefined, undefined, 2)
      ).rejects.toThrow(AIServiceExhaustedError);
      
      // Total attempts made: 2 (exhausted maxAttempts of 2)
      // Attempt 1: Gemini key 1
      // Attempt 2: Gemini key 2
      // Then Exhausted. OpenRouter is never called because budget is 2.
      expect(geminiProvider.call).toHaveBeenCalledTimes(2);
      expect(openRouterProvider.call).not.toHaveBeenCalled();
    });

    it('should full provider cascade: Gemini ❌ -> OpenRouter ❌ -> Groq ✅', async () => {
      // Setup mock keys for 3 providers
      keyPoolService.getKeysForProvider.mockImplementation((provider) => {
        if (provider === 'gemini') return ['g-key1', 'g-key2'];
        if (provider === 'openrouter') return ['o-key1', 'o-key2'];
        if (provider === 'groq') return ['q-key1'];
        return [];
      });

      // Expand routes for this test
      const fullRoutes = [
        ...routes,
        { provider: 'groq', model: 'groq-model' },
      ];

      // Gemini is globally RATE_LIMITED for both keys
      geminiProvider.call.mockRejectedValue({
        response: { status: 429 },
        message: 'Rate limit',
      });

      // OpenRouter is globally RATE_LIMITED for both keys
      openRouterProvider.call.mockRejectedValue({
        response: { status: 429 },
        message: 'Rate limit',
      });

      // Groq succeeds
      const groqProvider = {
        call: jest.fn().mockResolvedValue({ success: true, data: 'groq-success' }),
      };
      (service as any).providers['groq'] = groqProvider;

      const result = await service.executeWithFallback('test', fullRoutes, 'prompt', undefined, undefined, 10);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('groq-success');

      // The attempt counter should only count ACTUAL calls.
      // Wait, 429 RATE_LIMITED consumes an attempt and marks the key unhealthy. 
      // But let's check how many calls were made.
      expect(geminiProvider.call).toHaveBeenCalledTimes(2);
      expect(openRouterProvider.call).toHaveBeenCalledTimes(2);
      expect(groqProvider.call).toHaveBeenCalledTimes(1);

      // The key is marked unhealthy inside AiHealthService, which prevents it from being called again.
      expect(aiHealthService.markRateLimited).toHaveBeenCalledTimes(4); // 2 gemini + 2 openrouter
    });
  });
});
