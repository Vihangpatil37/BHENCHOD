import { TraitMatchingEngineService } from './trait-matching-engine.service';
import { StudentDNA } from '../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../careers/schemas/career.schema';

const service = new TraitMatchingEngineService();

const makeDNA = (overrides: Partial<StudentDNA> = {}): StudentDNA => ({
  analytical_thinking: 50, creativity: 50, communication: 50,
  leadership: 50, research: 50, business_acumen: 50,
  technical_curiosity: 50, empathy: 50, patience: 50,
  risk_tolerance: 50, computed_at: new Date(), source_version: 'v1',
  ...overrides,
});

const makeCareer = (career_code: string, trait_weights: any = {}): CareerDocument =>
  ({ career_code, trait_weights, name: career_code, description: '' }) as any;

describe('TraitMatchingEngineService', () => {
  describe('matchCareers', () => {
    it('returns empty array for no careers', () => {
      const result = service.matchCareers(makeDNA(), []);
      expect(result).toEqual([]);
    });

    it('scores 100 for identical vectors', () => {
      const career = makeCareer('cs', {
        analytical_thinking: 80, creativity: 80, communication: 80,
        leadership: 80, research: 80, business_acumen: 80,
        technical_curiosity: 80, empathy: 80, patience: 80,
        risk_tolerance: 80,
      });
      const dna = makeDNA({
        analytical_thinking: 80, creativity: 80, communication: 80,
        leadership: 80, research: 80, business_acumen: 80,
        technical_curiosity: 80, empathy: 80, patience: 80,
        risk_tolerance: 80,
      });
      const result = service.matchCareers(dna, [career]);
      expect(result[0].score).toBe(100);
    });

    it('sorts descending by score', () => {
      const dna = makeDNA({ analytical_thinking: 90, creativity: 80, business_acumen: 10 });
      const careers = [
        makeCareer('high_match', { analytical_thinking: 85, creativity: 75, communication: 50, leadership: 50, research: 50, business_acumen: 15, technical_curiosity: 50, empathy: 50, patience: 50, risk_tolerance: 50 }),
        makeCareer('low_match', { analytical_thinking: 10, creativity: 10, communication: 50, leadership: 50, research: 50, business_acumen: 90, technical_curiosity: 50, empathy: 50, patience: 50, risk_tolerance: 50 }),
        makeCareer('mid_match', { analytical_thinking: 50, creativity: 50, communication: 50, leadership: 50, research: 50, business_acumen: 50, technical_curiosity: 50, empathy: 50, patience: 50, risk_tolerance: 50 }),
      ];
      const result = service.matchCareers(dna, careers);
      expect(result.length).toBe(3);
      expect(result[0].career.career_code).toBe('high_match');
      expect(result[2].career.career_code).toBe('low_match');
    });

    it('limits to top 20 when more careers exist', () => {
      const careers = Array.from({ length: 30 }, (_, i) =>
        makeCareer(`c${i}`, {
          analytical_thinking: 50, creativity: 50, communication: 50,
          leadership: 50, research: 50, business_acumen: 50,
          technical_curiosity: 50, empathy: 50, patience: 50,
          risk_tolerance: 50,
        })
      );
      const result = service.matchCareers(makeDNA(), careers);
      expect(result.length).toBe(20);
    });
  });
});
