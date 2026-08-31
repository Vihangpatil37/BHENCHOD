import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Recommendation,
  RecommendationSchema,
} from './schemas/recommendation.schema';
import {
  RecommendationFeedback,
  RecommendationFeedbackSchema,
} from './schemas/recommendation-feedback.schema';
import { RecommendationService } from './recommendation.service';
import { EligibilityEngineService } from './eligibility-engine.service';
import { TraitMatchingEngineService } from './trait-matching-engine.service';
import { RecommendationController } from './recommendation.controller';
import { CareersModule } from '../careers/careers.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { AIServiceModule } from '../ai-service/ai-service.module';
import { QueueModule } from '../queue/queue.module';
import { RECOMMENDATION_ENGINE_VERSION } from './config/recommendation.constants';
import { AcademicEngine } from './engines/academic.engine';
import { InterestEngine } from './engines/interest.engine';
import { SkillEngine } from './engines/skill.engine';
import { PersonalityEngine } from './engines/personality.engine';
import { ConstraintEngine } from './engines/constraint.engine';
import { EligibilityEngine } from './engines/eligibility.engine';
import { HybridRankingEngine } from './engines/hybrid-ranking.engine';
import { DiversityEngine } from './engines/diversity.engine';
import { OpportunityEngine } from './engines/opportunity.engine';
import { ConfidenceEngine } from './engines/confidence.engine';
import { ExplainabilityEngine } from './engines/explainability.engine';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      {
        name: RecommendationFeedback.name,
        schema: RecommendationFeedbackSchema,
      },
    ]),
    CareersModule,
    OnboardingModule,
    AIServiceModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    EligibilityEngineService,
    TraitMatchingEngineService,
    AcademicEngine,
    InterestEngine,
    SkillEngine,
    PersonalityEngine,
    ConstraintEngine,
    EligibilityEngine,
    HybridRankingEngine,
    DiversityEngine,
    OpportunityEngine,
    ConfidenceEngine,
    ExplainabilityEngine,
    {
      provide: 'RECOMMENDATION_ENGINE_VERSION',
      useValue: RECOMMENDATION_ENGINE_VERSION,
    },
  ],
  exports: [
    RecommendationService,
    MongooseModule,
    'RECOMMENDATION_ENGINE_VERSION',
    AcademicEngine,
    InterestEngine,
    SkillEngine,
    PersonalityEngine,
    ConstraintEngine,
    EligibilityEngine,
    HybridRankingEngine,
    DiversityEngine,
    OpportunityEngine,
    ConfidenceEngine,
    ExplainabilityEngine,
  ],
})
export class RecommendationModule {}
