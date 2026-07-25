// engines/eligibility.engine.spec.ts
import { EligibilityEngine } from './eligibility.engine';
import { EligibilityEngineService } from '../eligibility-engine.service';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('EligibilityEngine', () => {
  let engine: EligibilityEngine;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getEligibleCareers: jest.fn(),
    };
    engine = new EligibilityEngine(mockService as EligibilityEngineService);
  });

  it('returns 100 when the career is eligible', async () => {
    const student = { user_id: 'test' } as StudentProfile;
    const career = { career_code: 'se' } as CareerDocument;
    mockService.getEligibleCareers.mockResolvedValue([{ career_code: 'se' }]);

    const breakdown = await engine.calculate(student, career);
    expect(breakdown.score).toBe(100);
    expect(breakdown.matchedFactors).toContain(
      'Meets all eligibility criteria',
    );
  });

  it('returns 0 when the career is not eligible', async () => {
    const student = { user_id: 'test' } as StudentProfile;
    const career = { career_code: 'se' } as CareerDocument;
    mockService.getEligibleCareers.mockResolvedValue([]);

    const breakdown = await engine.calculate(student, career);
    expect(breakdown.score).toBe(0);
    expect(breakdown.missingFactors).toContain(
      'Fails academic or budget eligibility constraints',
    );
  });
});
