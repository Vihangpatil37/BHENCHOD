// engines/explainability.engine.spec.ts
import { ExplainabilityEngine } from './explainability.engine';
import { HybridRankedResult } from './hybrid-ranking.engine';

describe('ExplainabilityEngine', () => {
  let engine: ExplainabilityEngine;

  beforeEach(() => {
    engine = new ExplainabilityEngine();
  });

  it('produces a structured RecommendationReason object without AI calls', () => {
    const mockResult: HybridRankedResult = {
      career_code: 'se',
      name: 'Software Engineer',
      score: 95,
      breakdown: {
        academic: {
          score: 90,
          weight: 0.25,
          weightedScore: 22.5,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: ['Math score meets requirements'],
          missingFactors: [],
          reasoning: [],
        },
        interest: {
          score: 85,
          weight: 0.2,
          weightedScore: 17,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: ['Shared interest in technology'],
          missingFactors: [],
          reasoning: [],
        },
        skill: {
          score: 80,
          weight: 0.2,
          weightedScore: 16,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: ['Coding skill fits requirements'],
          missingFactors: [],
          reasoning: [],
        },
        personality: {
          score: 90,
          weight: 0.15,
          weightedScore: 13.5,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: ['Analytical thinking aligns well'],
          missingFactors: [],
          reasoning: [],
        },
        constraint: {
          score: 100,
          weight: 0.1,
          weightedScore: 10,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: [],
          reasoning: [],
        },
      },
    };

    const reason = engine.explain(mockResult, 1, 90);
    expect(reason.careerId).toBe('se');
    expect(reason.rank).toBe(1);
    expect(reason.finalScore).toBe(95);
    expect(reason.confidence).toBe(90);
    expect(reason.primaryReasons).toContain('Math score meets requirements');
    expect(reason.studentStrengths).toContain(
      'Analytical thinking aligns well',
    );
  });

  it('applies copy guardrail filtering to clean up banned rejection language', () => {
    const mockResult: HybridRankedResult = {
      career_code: 'doc',
      name: 'Doctor',
      score: 75,
      breakdown: {
        academic: {
          score: 50,
          weight: 0.25,
          weightedScore: 12.5,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: ['Science score is too low'],
          reasoning: [],
        },
        interest: {
          score: 80,
          weight: 0.2,
          weightedScore: 16,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: [],
          reasoning: [],
        },
        skill: {
          score: 80,
          weight: 0.2,
          weightedScore: 16,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: [],
          reasoning: [],
        },
        personality: {
          score: 80,
          weight: 0.15,
          weightedScore: 12,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: [],
          reasoning: [],
        },
        constraint: {
          score: 50,
          weight: 0.1,
          weightedScore: 5,
          confidence: 100,
          bonuses: 0,
          penalties: 0,
          matchedFactors: [],
          missingFactors: ['You cannot afford the budget tier'],
          reasoning: [],
        },
      },
    };

    const reason = engine.explain(mockResult, 2, 85);
    expect(reason.improvementAreas).toContain(
      'Science score is has room to grow',
    );
    expect(reason.improvementAreas).toContain(
      'You may require additional pathways to afford the budget tier',
    );
  });
});
