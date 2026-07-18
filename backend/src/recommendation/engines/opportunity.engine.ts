// engines/opportunity.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { getWeights } from '../utils/weight-calculator';

@Injectable()
export class OpportunityEngine extends BaseScoringEngine {
  readonly name = 'opportunity';

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const opportunityWeight = weights.opportunity;

    const metadata = (career as any).careerMetadata || {};
    let score = metadata.careerOpportunity;

    const matchedFactors: string[] = [];
    const missingFactors: string[] = [];

    if (typeof score !== 'number') {
      const demand = career.market_demand || 'Medium';
      const scope = career.future_scope || 'Stable';
      const risk = metadata.automationRisk ?? 40;

      let demandScore = 70;
      if (demand === 'High') demandScore = 100;
      if (demand === 'Low') demandScore = 40;

      let scopeScore = 70;
      if (scope === 'Growing') scopeScore = 100;
      if (scope === 'Shrinking') scopeScore = 30;

      const riskScore = 100 - risk;

      score = (demandScore + scopeScore + riskScore) / 3;
    }

    if (score >= 80) {
      matchedFactors.push('Strong market demand and positive future outlook');
    } else if (score < 50) {
      missingFactors.push('Below-average growth rate or higher automation exposure');
    }

    const reasoning = [`Market opportunity score of ${Math.round(score)}% based on industry trends`];

    return {
      score: Math.round(score),
      weight: opportunityWeight,
      weightedScore: Number((score * opportunityWeight).toFixed(2)),
      confidence: 100,
      bonuses: 0,
      penalties: 0,
      matchedFactors,
      missingFactors,
      reasoning,
    };
  }
}
