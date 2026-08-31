import { Test, TestingModule } from '@nestjs/testing';
import { RetryManagerService, aiServiceEvents } from './retry-manager.service';
import { KeyPoolService } from './key-pool.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GLMProvider } from './providers/glm.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { RouteConfig } from './router.service';
import { AIServiceExhaustedError } from './errors/ai-service-exhausted.error';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('RetryManagerService', () => {
  let service: RetryManagerService;
  let keyPoolService: jest.Mocked<KeyPoolService>;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let mistralProvider: jest.Mocked<MistralProvider>;
  
  beforeEach(async () => {
    keyPoolService = {
      getKeysForProvider: jest.fn(),
    } as any;
    
    geminiProvider = {
      call: jest.fn(),
    } as any;
    
    mistralProvider = {
      call: jest.fn(),
    } as any;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryManagerService,
        { provide: KeyPoolService, useValue: keyPoolService },
        { provide: GeminiProvider, useValue: geminiProvider },
        { provide: GroqProvider, useValue: {} },
        { provide: MistralProvider, useValue: mistralProvider },
        { provide: GLMProvider, useValue: {} },
        { provide: OpenRouterProvider, useValue: {} },
      ],
    }).compile();

    service = module.get<RetryManagerService>(RetryManagerService);
    jest.spyOn(aiServiceEvents, 'emit').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should build deterministic attempt plan', () => {
    keyPoolService.getKeysForProvider.mockImplementation((p) => {
      if (p === 'gemini') return ['gem-1'];
      if (p === 'mistral') return ['mis-1', 'mis-2'];
      return [];
    });
    
    const routes: RouteConfig[] = [
      { provider: 'gemini', model: 'gemini-1' },
      { provider: 'mistral', model: 'mistral-1' },
    ];
    
    const plan = service.buildAttemptPlan(routes);
    expect(plan).toHaveLength(3);
    expect(plan[0]).toMatchObject({ provider: 'gemini', keyIndex: 0, apiKey: 'gem-1' });
    expect(plan[1]).toMatchObject({ provider: 'mistral', keyIndex: 0, apiKey: 'mis-1' });
    expect(plan[2]).toMatchObject({ provider: 'mistral', keyIndex: 1, apiKey: 'mis-2' });
  });

  it('should succeed on first attempt', async () => {
    keyPoolService.getKeysForProvider.mockReturnValue(['gem-1']);
    geminiProvider.call.mockResolvedValue({
      success: true,
      data: 'success',
      input_tokens: 10,
      output_tokens: 20,
    });
    
    const res = await service.executeWithFallback('test', [{ provider: 'gemini', model: 'gem-1' }], 'prompt');
    expect(res.success).toBe(true);
    expect(res.fallback_used).toBe(false);
    expect(geminiProvider.call).toHaveBeenCalledTimes(1);
  });

  it('should fallback to next key on timeout and return total_attempts', async () => {
    keyPoolService.getKeysForProvider.mockReturnValue(['mis-1', 'mis-2']);
    
    mistralProvider.call
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
      .mockResolvedValueOnce({
        success: true,
        data: 'success',
        input_tokens: 10,
        output_tokens: 20,
      });
      
    const res = await service.executeWithFallback('test', [{ provider: 'mistral', model: 'mistral-1' }], 'prompt');
    expect(res.success).toBe(true);
    expect(res.fallback_used).toBe(false); // Same provider
    expect(mistralProvider.call).toHaveBeenCalledTimes(2);
  });

  it('should skip provider keys on auth error', async () => {
    keyPoolService.getKeysForProvider.mockImplementation((p) => {
      if (p === 'mistral') return ['mis-1', 'mis-2', 'mis-3'];
      if (p === 'gemini') return ['gem-1'];
      return [];
    });
    
    mistralProvider.call.mockRejectedValue({ response: { status: 401 } });
    geminiProvider.call.mockResolvedValue({
      success: true,
      data: 'success',
      input_tokens: 1,
      output_tokens: 1,
    });
    
    const res = await service.executeWithFallback(
      'test', 
      [{ provider: 'mistral', model: 'm1' }, { provider: 'gemini', model: 'g1' }], 
      'prompt'
    );
    
    expect(res.success).toBe(true);
    expect(res.fallback_used).toBe(true);
    // Mistral has 3 keys, but because of 401 on first key, it skips the rest!
    expect(mistralProvider.call).toHaveBeenCalledTimes(1);
    expect(geminiProvider.call).toHaveBeenCalledTimes(1);
  });

  it('should throw exhaust error if all fail', async () => {
    keyPoolService.getKeysForProvider.mockReturnValue(['gem-1']);
    geminiProvider.call.mockRejectedValue({ response: { status: 500 } });
    
    await expect(
      service.executeWithFallback('test', [{ provider: 'gemini', model: 'gem-1' }], 'prompt')
    ).rejects.toThrow(AIServiceExhaustedError);
  });
});
