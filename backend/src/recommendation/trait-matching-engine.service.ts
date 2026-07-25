import { Injectable, Logger } from '@nestjs/common';
import { CareerDocument } from '../careers/schemas/career.schema';
import { StudentDNA } from '../onboarding/schemas/student-profile.schema';
import { cosineSimilarity } from '../common/vector-math';

export const TRAIT_KEYS = [
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

@Injectable()
export class TraitMatchingEngineService {
  private readonly logger = new Logger(TraitMatchingEngineService.name);

  matchCareers(
    dna: StudentDNA,
    eligibleCareers: CareerDocument[],
  ): { career: CareerDocument; score: number }[] {
    this.logger.log(
      `Running Trait Matching Engine against ${eligibleCareers.length} eligible careers`,
    );

    // 1. Build vector for Student DNA
    const dnaVector = TRAIT_KEYS.map((key) => (dna as any)[key] || 0);

    const scored = eligibleCareers.map((career) => {
      // 2. Build vector for Career Trait Weights
      const careerWeights = career.trait_weights || {};
      const careerVector = TRAIT_KEYS.map(
        (key) => (careerWeights as any)[key] || 0,
      );

      // 3. Compute cosine similarity (convert -1 to 1 to a 0 to 100 percentage score)
      const similarity = cosineSimilarity(dnaVector, careerVector);
      const score = Math.round(similarity * 100);

      return {
        career,
        score,
      };
    });

    // 4. Sort descending by score, take top 20
    const sorted = scored.sort((a, b) => b.score - a.score);
    const top20 = sorted.slice(0, 20);

    this.logger.log(`Matched top ${top20.length} careers`);
    return top20;
  }
}
