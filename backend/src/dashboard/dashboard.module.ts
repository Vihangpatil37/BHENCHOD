import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { CareersModule } from '../careers/careers.module';

@Module({
  imports: [AuthModule, OnboardingModule, RecommendationModule, CareersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
