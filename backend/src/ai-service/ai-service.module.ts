import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIRequestLog, AIRequestLogSchema } from './ai-request-log.schema';
import { KeyPoolService } from './key-pool.service';
import { RouterService } from './router.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CacheService } from './cache.service';
import { RetryManagerService } from './retry-manager.service';
import { JsonValidatorService } from './json-validator.service';
import { TokenLoggerService } from './token-logger.service';
import { AIServiceClient } from './ai-service.client';
import { AIServiceController } from './ai-service.controller';

// Providers
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { GLMProvider } from './providers/glm.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AIRequestLog.name, schema: AIRequestLogSchema }]),
  ],
  controllers: [AIServiceController],
  providers: [
    KeyPoolService,
    RouterService,
    PromptBuilderService,
    CacheService,
    RetryManagerService,
    JsonValidatorService,
    TokenLoggerService,
    AIServiceClient,
    GeminiProvider,
    GroqProvider,
    MistralProvider,
    GLMProvider,
    OpenRouterProvider,
  ],
  exports: [
    AIServiceClient,
    KeyPoolService,
    RouterService,
    PromptBuilderService,
    CacheService,
  ],
})
export class AIServiceModule {}
