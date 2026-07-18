// engines/hybrid-ranking.engine.ts
import { Injectable } from '@nestjs/common';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { THRESHOLDS } from '../config/thresholds';

export interface HybridInput {
  academic: ScoreBreakdown;
  interest: ScoreBreakdown;
  skill: ScoreBreakdown;
  personality: ScoreBreakdown;
  constraint: ScoreBreakdown;
  opportunity?: ScoreBreakdown; // Optional in earlier phases
}

export interface HybridRankedResult {
  career_code: string;
  name: string;
  score: number;
  breakdown: HybridInput;
}

@Injectable()
export class HybridRankingEngine {
  calculate(
    careerCode: string,
    careerName: string,
    inputs: HybridInput
  ): { score: number; totalBonuses: number; totalPenalties: number } {
    const engines = [
      inputs.academic,
      inputs.interest,
      inputs.skill,
      inputs.personality,
      inputs.constraint,
      inputs.opportunity,
    ].filter((e): e is ScoreBreakdown => !!e);

    // Calculate the weighted base score sum
    let weightedBaseScoreSum = 0;
    let sumWeights = 0;
    let sumBonuses = 0;
    let sumPenalties = 0;

    for (const engine of engines) {
      // Extract the engine base score before its own bonuses/penalties
      const baseScore = engine.score - engine.bonuses + engine.penalties;
      weightedBaseScoreSum += baseScore * engine.weight;
      sumWeights += engine.weight;
      sumBonuses += engine.bonuses;
      sumPenalties += engine.penalties;
    }

    // Normalize weighted base score sum if weights don't sum to 1.0 (e.g. when Opportunity is missing)
    if (sumWeights > 0 && Math.abs(sumWeights - 1.0) > 0.001) {
      weightedBaseScoreSum = (weightedBaseScoreSum / sumWeights);
    }

    // Apply global caps to bonuses and penalties
    const globalBonuses = Math.min(sumBonuses, THRESHOLDS.HYBRID_RANKING_BONUS_CAP);
    const globalPenalties = Math.min(sumPenalties, THRESHOLDS.HYBRID_RANKING_PENALTY_CAP);

    const finalScore = Math.min(
      100,
      Math.max(0, weightedBaseScoreSum + globalBonuses - globalPenalties)
    );

    return {
      score: Math.round(finalScore * 100) / 100, // round to 2 decimal places
      totalBonuses: globalBonuses,
      totalPenalties: globalPenalties,
    };
  }

  rank(results: HybridRankedResult[]): HybridRankedResult[] {
    return results.sort((a, b) => {
      const diff = b.score - a.score;
      if (Math.abs(diff) >= THRESHOLDS.TIE_BREAK_DIFFERENCE) {
        return diff;
      }

      // Tie-breaking priority: Interest -> Skill -> Personality -> Opportunity -> Alphabetical
      const interestDiff = (b.breakdown.interest?.score ?? 0) - (a.breakdown.interest?.score ?? 0);
      if (interestDiff !== 0) return interestDiff;

      const skillDiff = (b.breakdown.skill?.score ?? 0) - (a.breakdown.skill?.score ?? 0);
      if (skillDiff !== 0) return skillDiff;

      const personalityDiff = (b.breakdown.personality?.score ?? 0) - (a.breakdown.personality?.score ?? 0);
      if (personalityDiff !== 0) return personalityDiff;

      const opportunityDiff = (b.breakdown.opportunity?.score ?? 0) - (a.breakdown.opportunity?.score ?? 0);
      if (opportunityDiff !== 0) return opportunityDiff;

      return a.name.localeCompare(b.name);
    });
  }
}
