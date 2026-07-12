import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentProfile, StudentProfileSchema } from './schemas/student-profile.schema';
import { StudentDNAHistory, StudentDNAHistorySchema } from './schemas/student-dna-history.schema';
import { OnboardingService } from './onboarding.service';
import { OnboardingFlowService } from './onboarding-flow.service';
import { TraitEngineService } from './trait-engine.service';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: StudentDNAHistory.name, schema: StudentDNAHistorySchema },
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingFlowService, TraitEngineService],
  exports: [OnboardingService, MongooseModule],
})
export class OnboardingModule {}
