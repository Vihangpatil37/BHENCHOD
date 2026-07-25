// engines/opportunity.engine.spec.ts
import { OpportunityEngine } from './opportunity.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('OpportunityEngine', () => {
  let engine: OpportunityEngine;

  beforeEach(() => {
    engine = new OpportunityEngine();
  });

  it('uses precomputed opportunity score if present in metadata', () => {
    const student = {} as StudentProfile;
    const career = {
      careerMetadata: {
        careerOpportunity: 85,
      },
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBe(85);
    expect(result.matchedFactors).toContain(
      'Strong market demand and positive future outlook',
    );
  });

  it('computes score dynamically using market_demand and future_scope if missing from metadata', () => {
    const student = {} as StudentProfile;
    const career = {
      market_demand: 'High',
      future_scope: 'Growing',
    } as unknown as CareerDocument;

    const result = engine.calculate(student, career);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});
