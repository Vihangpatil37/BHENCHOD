// engines/hybrid-ranking.engine.spec.ts
import {
  HybridRankingEngine,
  HybridInput,
  HybridRankedResult,
} from './hybrid-ranking.engine';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';

describe('HybridRankingEngine', () => {
  let engine: HybridRankingEngine;

  beforeEach(() => {
    engine = new HybridRankingEngine();
  });

  const dummyBreakdown = (
    score: number,
    weight: number,
    bonuses = 0,
    penalties = 0,
  ): ScoreBreakdown => ({
    score,
    weight,
    weightedScore: score * weight,
    confidence: 100,
    bonuses,
    penalties,
    matchedFactors: [],
    missingFactors: [],
    reasoning: [],
  });

  it('correctly calculates weighted hybrid score and applies global caps', () => {
    const inputs: HybridInput = {
      academic: dummyBreakdown(80, 0.25, 5, 0),
      interest: dummyBreakdown(90, 0.2, 10, 0),
      skill: dummyBreakdown(70, 0.2, 0, 10),
      personality: dummyBreakdown(85, 0.15, 0, 0),
      constraint: dummyBreakdown(90, 0.1, 0, 20),
      opportunity: dummyBreakdown(80, 0.1, 0, 0),
    };

    const result = engine.calculate('se', 'Software Engineer', inputs);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.totalBonuses).toBeLessThanOrEqual(15);
    expect(result.totalPenalties).toBeLessThanOrEqual(40);
  });

  it('correctly breaks ties when scores are close', () => {
    const list: HybridRankedResult[] = [
      {
        career_code: 'A',
        name: 'Career A',
        score: 85.0,
        breakdown: {
          academic: dummyBreakdown(80, 0.2),
          interest: dummyBreakdown(70, 0.2), // lower interest
          skill: dummyBreakdown(80, 0.2),
          personality: dummyBreakdown(80, 0.2),
          constraint: dummyBreakdown(80, 0.2),
        },
      },
      {
        career_code: 'B',
        name: 'Career B',
        score: 85.1, // very close score (within 0.5 tie-break threshold)
        breakdown: {
          academic: dummyBreakdown(80, 0.2),
          interest: dummyBreakdown(90, 0.2), // higher interest
          skill: dummyBreakdown(80, 0.2),
          personality: dummyBreakdown(80, 0.2),
          constraint: dummyBreakdown(80, 0.2),
        },
      },
    ];

    const sorted = engine.rank(list);
    // Career B has higher score AND higher interest, should be rank 1
    expect(sorted[0].career_code).toBe('B');
  });
});
