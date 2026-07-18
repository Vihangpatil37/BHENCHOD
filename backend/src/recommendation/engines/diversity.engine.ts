// engines/diversity.engine.ts
import { Injectable } from '@nestjs/common';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { cosineSimilarity } from '../../common/vector-math';

export interface DiversityInput {
  career: CareerDocument;
  score: number;
  originalResult?: any;
}

@Injectable()
export class DiversityEngine {
  diversify(
    candidates: DiversityInput[],
    mode: 'strict' | 'balanced' | 'exploration' = 'balanced',
    targetSize = 8
  ): DiversityInput[] {
    const similarityLimit = mode === 'strict' ? 0.70 : mode === 'exploration' ? 0.95 : 0.85;
    const maxPerCluster = mode === 'strict' ? 1 : mode === 'exploration' ? 3 : 2;

    const diversified: (DiversityInput & { related: string[] })[] = [];
    const clusterCounts = new Map<string, number>();

    for (const cand of candidates) {
      const career = cand.career;
      // Use careerMetadata.cluster if available, otherwise sub_domain_code or category_code
      const cluster = (career as any).careerMetadata?.cluster || career.sub_domain_code || career.category_code || 'general';

      // Check count limit in this cluster
      const currentCount = clusterCounts.get(cluster) ?? 0;
      if (currentCount >= maxPerCluster) {
        continue;
      }

      // Check similarity against already selected careers in the same cluster
      let isTooSimilar = false;
      let similarSelected: any = null;

      for (const selected of diversified) {
        const selCluster = (selected.career as any).careerMetadata?.cluster || selected.career.sub_domain_code || selected.career.category_code || 'general';
        if (selCluster === cluster) {
          const sim = this.calculateSimilarity(career, selected.career);
          if (sim > similarityLimit) {
            isTooSimilar = true;
            similarSelected = selected;
            break;
          }
        }
      }

      if (isTooSimilar) {
        similarSelected.related.push(career.career_code);
        continue;
      }

      // Accept candidate
      diversified.push({
        ...cand,
        related: [],
      });
      clusterCounts.set(cluster, currentCount + 1);

      if (diversified.length >= targetSize) {
        break;
      }
    }

    // Attach relatedCareers to the original result object if provided
    return diversified.map(d => {
      if (d.originalResult) {
        d.originalResult.relatedCareers = d.related;
      }
      return {
        career: d.career,
        score: d.score,
        originalResult: d.originalResult,
      };
    });
  }

  private calculateSimilarity(c1: CareerDocument, c2: CareerDocument): number {
    const v1 = (c1 as any).careerMetadata?.similarityVector;
    const v2 = (c2 as any).careerMetadata?.similarityVector;
    if (v1 && v2 && v1.length === v2.length && v1.length > 0) {
      return cosineSimilarity(v1, v2);
    }

    const t1 = c1.trait_weights;
    const t2 = c2.trait_weights;
    if (t1 && t2) {
      const keys = Object.keys(t1).filter(k => typeof (t1 as any)[k] === 'number');
      const vec1 = keys.map(k => (t1 as any)[k] ?? 0);
      const vec2 = keys.map(k => (t2 as any)[k] ?? 0);
      if (vec1.length > 0 && vec2.length > 0) {
        return cosineSimilarity(vec1, vec2);
      }
    }

    if (c1.career_code === c2.career_code) return 1.0;
    if (c1.sub_domain_code && c1.sub_domain_code === c2.sub_domain_code) return 0.90;
    if (c1.category_code === c2.category_code) return 0.60;
    return 0.10;
  }
}
