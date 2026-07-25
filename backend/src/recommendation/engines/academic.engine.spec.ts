// engines/academic.engine.spec.ts
import { AcademicEngine } from './academic.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('AcademicEngine', () => {
  let engine: AcademicEngine;

  beforeEach(() => {
    engine = new AcademicEngine();
  });

  it('correctly scores academic profile', () => {
    const student = {
      academic: {
        class10: {
          percentage: 85,
          subjects: {
            maths: 90,
            science: 85,
            english: 80,
            sst: 75,
            computer: 80,
          },
          favorite_subjects: ['Maths', 'Science'],
          weak_subjects: [],
        },
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      eligibility: {
        min_maths: 80,
        min_science: 80,
      },
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
  });

  it('handles missing academic data gracefully', () => {
    const student = {} as StudentProfile;
    const career = {} as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBe(20);
    expect(result.confidence).toBe(30);
  });
});
