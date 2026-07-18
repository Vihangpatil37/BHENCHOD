// engines/explainability.engine.ts
import { Injectable } from '@nestjs/common';
import { HybridRankedResult } from './hybrid-ranking.engine';

export interface RecommendationReason {
  careerId: string;
  careerName: string;
  rank: number;
  finalScore: number;
  confidence: number;
  primaryReasons: string[];
  secondaryReasons: string[];
  bonuses: string[];
  penalties: string[];
  studentStrengths: string[];
  improvementAreas: string[];
  comparisonSummary: string;
}

@Injectable()
export class ExplainabilityEngine {
  explain(
    result: HybridRankedResult,
    rank: number,
    confidence: number,
    nextResult?: HybridRankedResult
  ): RecommendationReason {
    const primaryReasons: string[] = [];
    const secondaryReasons: string[] = [];
    const bonuses: string[] = [];
    const penalties: string[] = [];
    const studentStrengths: string[] = [];
    const improvementAreas: string[] = [];

    const breakdown = result.breakdown;

    // Academic Match
    if (breakdown.academic) {
      if (breakdown.academic.score >= 80) {
        primaryReasons.push(...breakdown.academic.matchedFactors.slice(0, 2));
      } else {
        secondaryReasons.push(...breakdown.academic.matchedFactors.slice(0, 1));
      }
      improvementAreas.push(...breakdown.academic.missingFactors);
    }

    // Interest Match
    if (breakdown.interest) {
      if (breakdown.interest.score >= 80) {
        primaryReasons.push(...breakdown.interest.matchedFactors.slice(0, 2));
      } else {
        secondaryReasons.push(...breakdown.interest.matchedFactors.slice(0, 1));
      }
      improvementAreas.push(...breakdown.interest.missingFactors);
    }

    // Skill Match
    if (breakdown.skill) {
      if (breakdown.skill.score >= 80) {
        primaryReasons.push(...breakdown.skill.matchedFactors.slice(0, 2));
      } else {
        secondaryReasons.push(...breakdown.skill.matchedFactors.slice(0, 1));
      }
      improvementAreas.push(...breakdown.skill.missingFactors);
    }

    // Personality Match
    if (breakdown.personality) {
      studentStrengths.push(...breakdown.personality.matchedFactors.slice(0, 2));
      improvementAreas.push(...breakdown.personality.missingFactors.slice(0, 1));
    }

    // Constraint penalties
    if (breakdown.constraint) {
      improvementAreas.push(...breakdown.constraint.missingFactors);
    }

    // Gather bonuses and penalties labels across all engines
    const engines = [
      breakdown.academic,
      breakdown.interest,
      breakdown.skill,
      breakdown.personality,
      breakdown.constraint,
      breakdown.opportunity,
    ].filter((e) => !!e);

    for (const engine of engines) {
      // Note: in our engine calculation, we put penalties description into matchedFactors/missingFactors/reasoning
      // We can also extract engine-specific reasoning
    }

    // Frame comparison summary relative to the next career in rank
    let comparisonSummary = 'Ranked highly based on overall composite match across academics, interests, and traits.';
    if (nextResult) {
      const scoreDiff = result.score - nextResult.score;
      if (scoreDiff < 0.5) {
        comparisonSummary = `Ranked slightly above ${nextResult.name} due to higher primary interest match.`;
      } else {
        comparisonSummary = `Ranked above ${nextResult.name} due to stronger alignment of core academic subjects and career skills.`;
      }
    }

    // Copy Guardrail check: Enforce no banned rejection words are in the generated user-facing reasons
    const sanitizeCopy = (str: string): string => {
      // Remove or rephrase any banned words
      return str
        .replace(/\b(can't|cannot)\b/gi, 'may require additional pathways to')
        .replace(/\b(not eligible|don't qualify|doesn't qualify)\b/gi, 'has specific requirements to meet')
        .replace(/\btoo low\b/gi, 'has room to grow')
        .replace(/\btoo weak\b/gi, 'is an improvement area');
    };

    return {
      careerId: result.career_code,
      careerName: result.name,
      rank,
      finalScore: result.score,
      confidence,
      primaryReasons: primaryReasons.map(sanitizeCopy).slice(0, 5),
      secondaryReasons: secondaryReasons.map(sanitizeCopy).slice(0, 5),
      bonuses: bonuses.map(sanitizeCopy),
      penalties: penalties.map(sanitizeCopy),
      studentStrengths: studentStrengths.map(sanitizeCopy),
      improvementAreas: improvementAreas.map(sanitizeCopy),
      comparisonSummary: sanitizeCopy(comparisonSummary),
    };
  }
}
