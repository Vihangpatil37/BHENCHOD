import { Controller, Get } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import { AiHealthService } from './ai-health.service';
import { providerModels } from './config/provider-models.config';
import { Roles } from '../common/decorators/roles.decorator';
import axios from 'axios';

interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms?: number;
  error?: string;
}

// ponytail: simple in-memory cache with 5-min TTL for health check results
let healthCache: {
  timestamp: number;
  data: Record<string, ProviderHealth>;
} | null = null;
const HEALTH_CACHE_TTL = 5 * 60 * 1000;

@Controller('ai-service')
export class AIServiceController {
  private readonly providerEndpoints: Record<
    string,
    { url: string; auth: 'query' | 'header' }
  > = {
    gemini: {
      url: `https://generativelanguage.googleapis.com/${providerModels.gemini.api_version ?? 'v1'}/models`,
      auth: 'query',
    },
    groq: { url: 'https://api.groq.com/openai/v1/models', auth: 'header' },
    mistral: { url: 'https://api.mistral.ai/v1/models', auth: 'header' },
    glm: { url: 'https://open.bigmodel.cn/api/paas/v4/models', auth: 'header' },
  };

  constructor(
    private readonly keyPoolService: KeyPoolService,
    private readonly aiHealthService: AiHealthService
  ) {}

  @Get('health')
  @Roles('admin')
  async getHealth() {
    const states = await this.aiHealthService.getAllHealthStates();
    
    // Map internal prefix to safe keyIndex
    const safeStates = states.map(state => {
      const index = this.keyPoolService.getKeyIndex(state.provider, state.apiKeyPrefix);
      return {
        provider: state.provider,
        keyIndex: index !== -1 ? index : 'unknown',
        status: state.status,
        errorCount: state.errorCount,
        cooldownUntil: state.cooldownUntil,
      };
    });

    return { status: 'OK', providers: safeStates };
  }
}
