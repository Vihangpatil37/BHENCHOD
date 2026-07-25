// engines/diversity.engine.spec.ts
import { DiversityEngine, DiversityInput } from './diversity.engine';
import { CareerDocument } from '../../careers/schemas/career.schema';

describe('DiversityEngine', () => {
  let engine: DiversityEngine;

  beforeEach(() => {
    engine = new DiversityEngine();
  });

  const dummyCareer = (
    code: string,
    category: string,
    subDomain = 'sub',
  ): CareerDocument =>
    ({
      career_code: code,
      category_code: category,
      sub_domain_code: subDomain,
      name: code,
      trait_weights: {
        analytical_thinking: 80,
        creativity: 50,
        communication: 50,
        leadership: 50,
        research: 50,
        business_acumen: 50,
        technical_curiosity: 50,
        empathy: 50,
        patience: 50,
        risk_tolerance: 50,
      },
    }) as unknown as CareerDocument;

  it('filters out overly similar careers and moves them to related', () => {
    const list: DiversityInput[] = [
      {
        career: dummyCareer('se', 'science', 'se_pcm'),
        score: 95,
        originalResult: {},
      },
      {
        career: dummyCareer('ds', 'science', 'se_pcm'),
        score: 94,
        originalResult: {},
      }, // too similar (same category and subdomain)
      {
        career: dummyCareer('doctor', 'health', 'med_pcb'),
        score: 90,
        originalResult: {},
      }, // different category
    ];

    const result = engine.diversify(list, 'balanced', 5);
    expect(result).toHaveLength(2); // 'ds' filtered out
    expect(result[0].career.career_code).toBe('se');
    expect(result[0].originalResult.relatedCareers).toContain('ds');
    expect(result[1].career.career_code).toBe('doctor');
  });
});
