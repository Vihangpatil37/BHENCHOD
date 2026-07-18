// engines/constraint.engine.spec.ts
import { ConstraintEngine } from './constraint.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('ConstraintEngine', () => {
  let engine: ConstraintEngine;

  beforeEach(() => {
    engine = new ConstraintEngine();
  });

  it('correctly scores matching constraints', () => {
    const student = {
      constraints: {
        budget_tier: 3,
        study_duration_max: 4,
        willing_to_relocate: true,
        abroad_ok: false,
        govt_vs_private: 'any',
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      eligibility: {
        max_budget_tier: 3,
        min_study_duration_years: 3,
        abroad_required: false,
      },
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBe(100);
    expect(result.penalties).toBe(0);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
  });

  it('applies penalties for mismatches', () => {
    const student = {
      constraints: {
        budget_tier: 1,
        study_duration_max: 2,
        willing_to_relocate: false,
        abroad_ok: false,
        govt_vs_private: 'govt',
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      eligibility: {
        max_budget_tier: 3,
        min_study_duration_years: 4,
        abroad_required: false,
      },
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeLessThan(100);
    expect(result.penalties).toBeGreaterThan(0);
    expect(result.missingFactors.length).toBeGreaterThan(0);
  });
});
