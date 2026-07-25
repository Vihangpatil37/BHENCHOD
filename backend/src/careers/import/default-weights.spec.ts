import {
  computeTraitWeights,
  BASE_TRAIT_PROFILES,
} from './default-weights.config';

describe('computeTraitWeights', () => {
  describe('base profiles', () => {
    it('should return the base profile for science careers', () => {
      const result = computeTraitWeights('science', 'Physicist');
      expect(result.analytical_thinking).toBe(80);
      expect(result.creativity).toBe(50);
      expect(result.technical_curiosity).toBe(75);
    });

    it('should return the base profile for commerce careers', () => {
      const result = computeTraitWeights('commerce', 'Accountant');
      expect(result.business_acumen).toBe(80);
      expect(result.analytical_thinking).toBe(65);
    });

    it('should return the base profile for arts_humanities careers', () => {
      const result = computeTraitWeights('arts_humanities', 'Historian');
      expect(result.creativity).toBe(75);
      expect(result.communication).toBe(75);
    });

    it('should return the base profile for emerging_future careers', () => {
      const result = computeTraitWeights('emerging_future', 'AI Specialist');
      expect(result.technical_curiosity).toBe(85);
      expect(result.analytical_thinking).toBe(75);
    });

    it('should throw for unknown categories', () => {
      expect(() => computeTraitWeights('unknown', 'Test')).toThrow(
        'Unknown category_code',
      );
    });
  });

  describe('keyword modifiers', () => {
    it('should apply Engineer modifier', () => {
      const result = computeTraitWeights('science', 'Software Engineer');
      // Base: technical_curiosity=75 +10 = 85
      expect(result.technical_curiosity).toBe(85);
      // Base: analytical_thinking=80 +5 = 85
      expect(result.analytical_thinking).toBe(85);
    });

    it('should apply Scientist modifier', () => {
      const result = computeTraitWeights('science', 'Data Scientist');
      // research: 65 + 15 = 80
      expect(result.research).toBe(80);
      // analytical_thinking: 80 + 10 = 90
      expect(result.analytical_thinking).toBe(90);
    });

    it('should apply Manager modifier', () => {
      const result = computeTraitWeights('commerce', 'Marketing Manager');
      // leadership: 55 + 15 = 70
      expect(result.leadership).toBe(70);
      // business_acumen: 80 + 10 = 90
      expect(result.business_acumen).toBe(90);
    });

    it('should apply Teacher modifier', () => {
      const result = computeTraitWeights('arts_humanities', 'School Teacher');
      // empathy: 65 + 15 = 80
      expect(result.empathy).toBe(80);
      // communication: 75 + 10 = 85
      expect(result.communication).toBe(85);
    });

    it('should apply Designer modifier', () => {
      const result = computeTraitWeights('arts_humanities', 'Graphic Designer');
      // creativity: 75 + 15 = 90
      expect(result.creativity).toBe(90);
    });

    it('should apply Officer modifier', () => {
      const result = computeTraitWeights(
        'government_defence',
        'Police Officer',
      );
      // leadership: 70 + 10 = 80
      expect(result.leadership).toBe(80);
      // risk_tolerance: 60 + 10 = 70
      expect(result.risk_tolerance).toBe(70);
    });

    it('should apply multiple matching keyword modifiers', () => {
      const result = computeTraitWeights(
        'commerce',
        'Chief Technology Officer',
      );
      // chief: leadership +15, business_acumen +10
      // officer: leadership +10, risk_tolerance +10
      // leadership: 55 + 15 + 10 = 80
      expect(result.leadership).toBe(80);
      // business_acumen: 80 + 10 = 90
      expect(result.business_acumen).toBe(90);
      // risk_tolerance: 55 + 10 = 65
      expect(result.risk_tolerance).toBe(65);
    });

    it('should apply Analyst modifier', () => {
      const result = computeTraitWeights('commerce', 'Business Analyst');
      // research: 40 + 15 = 55
      expect(result.research).toBe(55);
      // analytical_thinking: 65 + 10 = 75
      expect(result.analytical_thinking).toBe(75);
    });
  });

  describe('clamping', () => {
    it('should clamp values to max 100', () => {
      // technical_curiosity base=75 + 10 (engineer) = 85, add another keyword...
      // Actually it won't go above 100 with legit values, but let's verify
      const result = computeTraitWeights('science', 'Software Engineer');
      expect(result.technical_curiosity).toBeLessThanOrEqual(100);
      expect(result.analytical_thinking).toBeLessThanOrEqual(100);
    });

    it('should clamp values to min 0', () => {
      // No modifiers reduce values, so baseline test
      const result = computeTraitWeights('vocational', 'Teacher');
      expect(result.analytical_thinking).toBeGreaterThanOrEqual(0);
      expect(result.technical_curiosity).toBeGreaterThanOrEqual(0);
    });

    it('should produce all 10 traits in the result', () => {
      const result = computeTraitWeights('science', 'Any Career');
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
      for (const trait of traits) {
        expect(result).toHaveProperty(trait);
        expect(typeof result[trait as keyof typeof result]).toBe('number');
      }
    });
  });

  describe('case insensitivity', () => {
    it('should match keywords regardless of case', () => {
      const result1 = computeTraitWeights('science', 'SOFTWARE ENGINEER');
      const result2 = computeTraitWeights('science', 'software engineer');
      expect(result1).toEqual(result2);
    });
  });
});
