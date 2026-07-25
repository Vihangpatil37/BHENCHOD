// utils/bonus.ts
export interface BonusRule {
  id: string;
  label: string;
  points: number;
}

export function evaluateBonusRules(
  rules: BonusRule[],
  evaluator: (ruleId: string) => boolean,
): { label: string; points: number }[] {
  const applied: { label: string; points: number }[] = [];
  for (const rule of rules) {
    if (evaluator(rule.id)) {
      applied.push({ label: rule.label, points: rule.points });
    }
  }
  return applied;
}
