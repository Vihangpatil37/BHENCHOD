// engines/base-scoring.engine.spec.ts
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';

class TestScoringEngine extends BaseScoringEngine {
  readonly name = 'TestEngine';
  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    return {
      score: 100,
      weight: 0.1,
      weightedScore: 10,
      confidence: 100,
      bonuses: 0,
      penalties: 0,
      matchedFactors: [],
      missingFactors: [],
      reasoning: [],
    };
  }

  testNormalize(value: number, min: number, max: number): number {
    return this.normalize(value, min, max);
  }

  testClamp(value: number, min?: number, max?: number): number {
    return this.clamp(value, min, max);
  }

  testApplyBonuses(base: number, bonuses: { label: string; points: number }[], cap?: number) {
    return this.applyBonuses(base, bonuses, cap);
  }

  testApplyPenalties(base: number, penalties: { label: string; points: number }[], cap?: number) {
    return this.applyPenalties(base, penalties, cap);
  }
}

describe('BaseScoringEngine', () => {
  let engine: TestScoringEngine;

  beforeEach(() => {
    engine = new TestScoringEngine();
  });

  it('normalizes values', () => {
    expect(engine.testNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps values within ranges', () => {
    expect(engine.testClamp(-50, 0, 100)).toBe(0);
    expect(engine.testClamp(150, 0, 100)).toBe(100);
  });

  it('applies and caps bonuses', () => {
    const bonuses = [
      { label: 'Bonus 1', points: 10 },
      { label: 'Bonus 2', points: 10 },
    ];
    const result = engine.testApplyBonuses(50, bonuses);
    expect(result.score).toBe(65);
    expect(result.total).toBe(15);
    expect(result.labels).toEqual(['Bonus 1', 'Bonus 2']);
  });

  it('applies and caps penalties', () => {
    const penalties = [
      { label: 'Penalty 1', points: 25 },
      { label: 'Penalty 2', points: 25 },
    ];
    const result = engine.testApplyPenalties(80, penalties);
    expect(result.score).toBe(40);
    expect(result.total).toBe(40);
    expect(result.labels).toEqual(['Penalty 1', 'Penalty 2']);
  });
});
