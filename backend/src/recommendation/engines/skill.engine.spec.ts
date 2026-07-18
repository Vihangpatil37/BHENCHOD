// engines/skill.engine.spec.ts
import { SkillEngine } from './skill.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('SkillEngine', () => {
  let engine: SkillEngine;

  beforeEach(() => {
    engine = new SkillEngine();
  });

  it('correctly scores matching skill profile', () => {
    const student = {
      skills: {
        coding: 5,
        problem_solving: 5,
        communication: 3,
      },
    } as unknown as StudentProfile;

    const career = {
      category_code: 'science',
      required_skills: ['Coding', 'Problem solving'],
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeGreaterThan(60);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
  });
});
