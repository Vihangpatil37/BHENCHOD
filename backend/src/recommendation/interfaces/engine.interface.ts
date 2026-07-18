// interfaces/engine.interface.ts
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from './score-breakdown.interface';

export interface RecommendationEngine {
  readonly name: string;
  readonly version: string;
  calculate(student: StudentProfile, career: CareerDocument): Promise<ScoreBreakdown> | ScoreBreakdown;
}
