import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { CareersModule } from '../careers/careers.module';

@Module({
  imports: [OnboardingModule, RecommendationModule, CareersModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
