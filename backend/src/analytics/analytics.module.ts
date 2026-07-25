import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from './schemas/analytics-event.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import {
  AIRequestLog,
  AIRequestLogSchema,
} from '../ai-service/ai-request-log.schema';
import {
  SavedCareer,
  SavedCareerSchema,
} from '../careers/schemas/saved-career.schema';
import { AIServiceModule } from '../ai-service/ai-service.module';
import { CareersModule } from '../careers/careers.module';

@Global() // Make Analytics global so it can be easily injected across other modules
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: AIRequestLog.name, schema: AIRequestLogSchema },
      { name: SavedCareer.name, schema: SavedCareerSchema },
    ]),
    AIServiceModule,
    CareersModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService, MongooseModule],
})
export class AnalyticsModule {}
