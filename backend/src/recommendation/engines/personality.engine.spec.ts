// engines/personality.engine.spec.ts
import { PersonalityEngine } from './personality.engine';
import { TraitMatchingEngineService } from '../trait-matching-engine.service';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('PersonalityEngine', () => {
  let engine: PersonalityEngine;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      matchCareers: jest.fn(),
    };
    engine = new PersonalityEngine(mockService as TraitMatchingEngineService);
  });

  it('correctly returns personality match score', () => {
    const student = {
      current_dna: {
        analytical_thinking: 80,
      },
    } as unknown as StudentProfile;

    const career = {
      trait_weights: {
        analytical_thinking: 80,
      },
    } as unknown as CareerDocument;

    mockService.matchCareers.mockReturnValue([{ score: 90 }]);

    const result = engine.calculate(student, career);
    expect(result.score).toBe(90);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
  });
});
