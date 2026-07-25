import { TraitEngineService } from './trait-engine.service';
import { StudentProfile } from './schemas/student-profile.schema';

const service = new TraitEngineService();

const baseProfile = {
  user_id: 'test-uuid',
  academic: {
    class10: {
      status: 'completed',
      subjects: { maths: 80, science: 70, english: 90, sst: 60, computer: 95 },
    },
  },
  interests: {
    research: 80,
    technology: 90,
    business: 60,
    design: 40,
    media: 30,
    teaching: 50,
    nature: 20,
    sports: 10,
    government: 20,
    finance: 30,
    helping_people: 70,
    machines: 10,
  },
  skills: {
    logical_thinking: 5,
    math: 4,
    creativity: 3,
    communication: 4,
    leadership: 2,
    coding: 5,
    drawing: 2,
    observation: 4,
    patience: 3,
    problem_solving: 5,
  },
  scenario_responses: [],
} as unknown as StudentProfile;

describe('TraitEngineService', () => {
  describe('computeDNA', () => {
    it('computes all 10 traits', () => {
      const dna = service.computeDNA(baseProfile);
      const traits = [
        'analytical_thinking',
        'creativity',
        'communication',
        'leadership',
        'research',
        'business_acumen',
        'technical_curiosity',
        'empathy',
        'patience',
        'risk_tolerance',
      ];
      traits.forEach((t) => {
        expect(dna).toHaveProperty(t);
        expect((dna as any)[t]).toBeGreaterThanOrEqual(0);
        expect((dna as any)[t]).toBeLessThanOrEqual(100);
      });
      expect(dna.source_version).toBe('v1');
      expect(dna.computed_at).toBeInstanceOf(Date);
    });

    it('produces high analytical_thinking for maths+science student', () => {
      const dna = service.computeDNA(baseProfile);
      expect(dna.analytical_thinking).toBeGreaterThan(60);
    });

    it('produces low creativity for non-creative profile', () => {
      const dna = service.computeDNA(baseProfile);
      expect(dna.creativity).toBeLessThan(60);
    });

    it('clamps values to 0-100', () => {
      const extremeProfile = {
        ...baseProfile,
        interests: { ...baseProfile.interests, research: 100, technology: 100 },
        skills: { ...baseProfile.skills, logical_thinking: 5, math: 5 },
        scenario_responses: [
          {
            question_id: 'q1',
            selected_option: 'A',
            trait_weights: { analytical_thinking: 100 },
          },
        ],
      } as unknown as StudentProfile;
      const dna = service.computeDNA(extremeProfile);
      expect(dna.analytical_thinking).toBeLessThanOrEqual(100);
    });

    it('falls back to default when subjects/interests/skills are null', () => {
      const emptyProfile = {
        user_id: 'empty-uuid',
        academic: { class10: { subjects: undefined } },
        interests: undefined,
        skills: undefined,
        scenario_responses: [],
      } as unknown as StudentProfile;
      const dna = service.computeDNA(emptyProfile);
      const traits = [
        'analytical_thinking',
        'creativity',
        'communication',
        'leadership',
        'research',
        'business_acumen',
        'technical_curiosity',
        'empathy',
        'patience',
        'risk_tolerance',
      ];
      traits.forEach((t) => {
        expect((dna as any)[t]).toBe(50);
      });
    });

    it('applies scenario response impacts', () => {
      const dna1 = service.computeDNA(baseProfile);
      const profileWithScenario = {
        ...baseProfile,
        scenario_responses: [
          {
            question_id: 'q1',
            selected_option: 'A',
            trait_weights: { risk_tolerance: 30 },
          },
          {
            question_id: 'q2',
            selected_option: 'B',
            trait_weights: { risk_tolerance: -15 },
          },
        ],
      } as unknown as StudentProfile;
      const dna2 = service.computeDNA(profileWithScenario);
      // scenario sum = 50 + 30 + (-15) = 65 for risk_tolerance
      // profileAvg stays same, final = profileAvg * 0.5 + 65 * 0.5
      // so dna2 should be higher than dna1 for risk_tolerance
      expect(dna2.risk_tolerance).not.toBe(dna1.risk_tolerance);
    });

    it('handles Map-format trait_weights', () => {
      const profile = {
        ...baseProfile,
        scenario_responses: [
          {
            question_id: 'q1',
            selected_option: 'A',
            trait_weights: new Map(Object.entries({ risk_tolerance: 20 })),
          },
        ],
      };
      const dna = service.computeDNA(profile);
      expect(dna.risk_tolerance).toBeGreaterThanOrEqual(0);
    });
  });
});
