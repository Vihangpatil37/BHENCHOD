import { Controller, Get } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import { providerModels } from './config/provider-models.config';
import { Public } from '../auth/decorators/public.decorator';
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

  constructor(private readonly keyPoolService: KeyPoolService) {}

  @Get('health')
  @Public()
  @Roles('admin')
  async getHealth() {
    if (healthCache && Date.now() - healthCache.timestamp < HEALTH_CACHE_TTL) {
      return { status: 'OK', providers: healthCache.data };
    }

    const providers = Object.keys(this.providerEndpoints);
    const statusMap: Record<string, ProviderHealth> = {};
    await Promise.allSettled(
      providers.map(async (name) => {
        const cfg = this.providerEndpoints[name];
        const keys = this.keyPoolService.getKeysForProvider(name);
        const key = keys[0];
        const start = Date.now();
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          let url = cfg.url;
          if (key) {
            if (cfg.auth === 'query') {
              url += `?key=${key}`;
            } else {
              headers['Authorization'] = `Bearer ${key}`;
            }
          }
          await axios.get(url, { headers, timeout: 5000 });
          statusMap[name] = {
            status: 'healthy',
            latency_ms: Date.now() - start,
          };
        } catch (err: any) {
          const status = err.response?.status;
          const isAuth = status === 401 || status === 403;
          statusMap[name] = {
            status: keys.length === 0 ? 'down' : isAuth ? 'degraded' : 'down',
            latency_ms: Date.now() - start,
            // ponytail: never expose provider error details to client
          };
        }
      }),
    );

    healthCache = { timestamp: Date.now(), data: statusMap };
    return { status: 'OK', providers: statusMap };
  }
}
