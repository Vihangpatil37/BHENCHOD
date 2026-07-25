import { evaluatePenaltyRules, PenaltyRule } from './penalty';

describe('penalty utility', () => {
  it('correctly evaluates and returns applied penalty rules', () => {
    const rules: PenaltyRule[] = [
      { id: 'math-weakness', label: 'Low Math Grade', points: 15 },
      { id: 'relocation-restriction', label: 'Cannot Relocate', points: 10 },
    ];

    const mockEvaluator = (ruleId: string) =>
      ruleId === 'relocation-restriction';

    const result = evaluatePenaltyRules(rules, mockEvaluator);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Cannot Relocate', points: 10 });
  });
});
