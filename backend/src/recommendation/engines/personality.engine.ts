// engines/personality.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { TraitMatchingEngineService, TRAIT_KEYS } from '../trait-matching-engine.service';
import { getWeights } from '../utils/weight-calculator';

@Injectable()
export class PersonalityEngine extends BaseScoringEngine {
  readonly name = 'personality';

  constructor(private readonly traitMatchingEngine: TraitMatchingEngineService) {
    super();
  }

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const personalityWeight = weights.personality;

    if (!student.current_dna) {
      return {
        score: 0,
        weight: personalityWeight,
        weightedScore: 0,
        confidence: 30,
        bonuses: 0,
        penalties: 0,
        matchedFactors: [],
        missingFactors: ['Missing Student DNA profile information'],
        reasoning: ['No Student DNA available'],
      };
    }

    const matches = this.traitMatchingEngine.matchCareers(student.current_dna, [career]);
    const score = matches[0]?.score ?? 0;

    const matchedFactors: string[] = [];
    const missingFactors: string[] = [];

    const dna = student.current_dna;
    const careerWeights = career.trait_weights || {};

    for (const key of TRAIT_KEYS) {
      const studentVal = (dna as any)[key] || 0;
      const careerVal = (careerWeights as any)[key] || 0;

      const humanFriendlyKey = key.replace('_', ' ');
      if (careerVal >= 70 && studentVal >= 70) {
        matchedFactors.push(`Your high ${humanFriendlyKey} aligns well with this career`);
      } else if (careerVal >= 70 && studentVal < 50) {
        missingFactors.push(`This career typically requires higher ${humanFriendlyKey}`);
      }
    }

    const reasoning = [`Personality alignment score of ${score}% via Student DNA matching`];

    return {
      score,
      weight: personalityWeight,
      weightedScore: Number((score * personalityWeight).toFixed(2)),
      confidence: 100,
      bonuses: 0,
      penalties: 0,
      matchedFactors,
      missingFactors,
      reasoning,
    };
  }
}
