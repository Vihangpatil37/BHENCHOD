import { Controller, Get } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ai-service')
export class AIServiceController {
  constructor(private readonly keyPoolService: KeyPoolService) {}

  @Get('health')
  @Public() // Public endpoint per spec
  getHealth() {
    const providers = ['gemini', 'groq', 'mistral', 'deepseek', 'glm'];
    const statusMap: Record<string, { loaded_keys_count: number; status: string }> = {};

    for (const provider of providers) {
      const keys = this.keyPoolService.getKeysForProvider(provider);
      statusMap[provider] = {
        loaded_keys_count: keys.length,
        status: keys.length > 0 ? 'READY' : 'MISCONFIGURED',
      };
    }

    return {
      status: 'OK',
      providers: statusMap,
    };
  }
}
