// engines/eligibility.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { EligibilityEngineService } from '../eligibility-engine.service';

@Injectable()
export class EligibilityEngine extends BaseScoringEngine {
  readonly name = 'eligibility';

  constructor(
    private readonly eligibilityEngineService: EligibilityEngineService,
  ) {
    super();
  }

  async calculate(
    student: StudentProfile,
    career: CareerDocument,
  ): Promise<ScoreBreakdown> {
    const eligibleCareers =
      await this.eligibilityEngineService.getEligibleCareers(student);
    const isEligible = eligibleCareers.some(
      (c) => c.career_code === career.career_code,
    );

    return {
      score: isEligible ? 100 : 0,
      weight: 0,
      weightedScore: 0,
      confidence: 100,
      bonuses: 0,
      penalties: 0,
      matchedFactors: isEligible
        ? ['Meets all eligibility criteria']
        : ['Does not meet eligibility criteria'],
      missingFactors: isEligible
        ? []
        : ['Fails academic or budget eligibility constraints'],
      reasoning: isEligible ? ['Eligible'] : ['Ineligible'],
    };
  }
}
