import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { RecommendationFeedback, RecommendationFeedbackSchema } from './schemas/recommendation-feedback.schema';
import { RecommendationService } from './recommendation.service';
import { EligibilityEngineService } from './eligibility-engine.service';
import { TraitMatchingEngineService } from './trait-matching-engine.service';
import { RecommendationController } from './recommendation.controller';
import { CareersModule } from '../careers/careers.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { AIServiceModule } from '../ai-service/ai-service.module';
import { RECOMMENDATION_ENGINE_VERSION } from './config/recommendation.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: RecommendationFeedback.name, schema: RecommendationFeedbackSchema },
    ]),
    CareersModule,
    OnboardingModule,
    AIServiceModule,
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    EligibilityEngineService,
    TraitMatchingEngineService,
    {
      provide: 'RECOMMENDATION_ENGINE_VERSION',
      useValue: RECOMMENDATION_ENGINE_VERSION,
    },
  ],
  exports: [RecommendationService, MongooseModule, 'RECOMMENDATION_ENGINE_VERSION'],
})
export class RecommendationModule {}
