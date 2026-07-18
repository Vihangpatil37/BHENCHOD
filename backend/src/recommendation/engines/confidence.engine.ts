// engines/confidence.engine.ts
import { Injectable } from '@nestjs/common';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { HybridRankedResult } from './hybrid-ranking.engine';

@Injectable()
export class ConfidenceEngine {
  calculate(student: StudentProfile, rankedResults: HybridRankedResult[]): number {
    // 1. Profile Completeness (29% weight)
    const completeness = student.completion_percentage ?? 0;

    // 2. Answer Consistency (24% weight)
    const responsesCount = student.scenario_responses?.length ?? 0;
    const consistency = Math.min(100, responsesCount * 10);

    // 3. Career Separation (24% weight)
    let separation = 50; // default middle value
    if (rankedResults.length >= 5) {
      const score1 = rankedResults[0].score;
      const score5 = rankedResults[4].score;
      separation = Math.min(100, Math.max(0, (score1 - score5) * 5));
    }

    // 4. Assessment Quality (12% weight)
    const assessmentQuality = student.onboarding_step === 'complete' ? 100 : 50;

    // 5. Data Quality (12% weight)
    const academic = student.academic || {};
    const hasClass10 = !!academic.class10;
    const hasClass12 = !!academic.class12;
    const dataQuality = (hasClass10 ? 50 : 0) + (hasClass12 ? 50 : 0);

    // TODO: re-enable stability component once versioning ships (currently disabled, weight redistributed)
    const confidenceScore =
      completeness * 0.29 +
      consistency * 0.24 +
      separation * 0.24 +
      assessmentQuality * 0.12 +
      dataQuality * 0.12;

    return Math.min(100, Math.max(0, Math.round(confidenceScore)));
  }
}
