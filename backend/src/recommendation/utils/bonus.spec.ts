import { evaluateBonusRules, BonusRule } from './bonus';

describe('bonus utility', () => {
  it('correctly evaluates and returns applied bonus rules', () => {
    const rules: BonusRule[] = [
      { id: 'math-star', label: 'Math Genius', points: 10 },
      { id: 'creative-star', label: 'Artistic Flair', points: 5 },
    ];

    const mockEvaluator = (ruleId: string) => ruleId === 'math-star';

    const result = evaluateBonusRules(rules, mockEvaluator);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Math Genius', points: 10 });
  });
});
