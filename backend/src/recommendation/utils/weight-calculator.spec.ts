import { getWeights, validateWeights, RecommendationWeights } from './weight-calculator';

describe('weight-calculator', () => {
  describe('validateWeights', () => {
    it('returns true when weights sum to 1.0 and opportunity ceiling is respected', () => {
      const valid: RecommendationWeights = {
        academic: 0.25,
        interest: 0.20,
        skill: 0.20,
        personality: 0.15,
        constraint: 0.10,
        opportunity: 0.10,
      };
      expect(validateWeights(valid)).toBe(true);
    });

    it('returns false when opportunity weight exceeds ceiling', () => {
      const invalid: RecommendationWeights = {
        academic: 0.20,
        interest: 0.15,
        skill: 0.15,
        personality: 0.10,
        constraint: 0.20,
        opportunity: 0.20, // exceeds 0.15 hard ceiling
      };
      expect(validateWeights(invalid)).toBe(false);
    });

    it('returns false when weights do not sum to 1.0', () => {
      const invalid: RecommendationWeights = {
        academic: 0.1,
        interest: 0.1,
        skill: 0.1,
        personality: 0.1,
        constraint: 0.1,
        opportunity: 0.1,
      };
      expect(validateWeights(invalid)).toBe(false);
    });
  });

  describe('getWeights', () => {
    it('returns a valid config-driven or default set of weights', () => {
      const weights = getWeights();
      expect(weights).toHaveProperty('academic');
      expect(weights).toHaveProperty('opportunity');
      expect(weights.opportunity).toBeLessThanOrEqual(0.15);
      const sum =
        weights.academic +
        weights.interest +
        weights.skill +
        weights.personality +
        weights.constraint +
        weights.opportunity;
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.0001);
    });
  });
});
