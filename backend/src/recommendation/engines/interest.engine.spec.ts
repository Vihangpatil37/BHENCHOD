// engines/interest.engine.spec.ts
import { InterestEngine } from './interest.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('InterestEngine', () => {
  let engine: InterestEngine;

  beforeEach(() => {
    engine = new InterestEngine();
  });

  it('correctly scores matching interest profile', () => {
    const student = {
      interests: {
        technology: 90,
        research: 80,
        business: 20,
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      name: 'Researcher',
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeGreaterThan(60);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
  });

  it('scores low for mismatching interest profile', () => {
    const student = {
      interests: {
        technology: 20,
        research: 10,
        business: 90,
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      name: 'Nuclear Scientist',
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeLessThan(70);
    expect(result.missingFactors.length).toBeGreaterThan(0);
  });
});
