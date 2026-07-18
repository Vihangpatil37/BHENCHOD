// engines/constraint.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { getWeights } from '../utils/weight-calculator';

@Injectable()
export class ConstraintEngine extends BaseScoringEngine {
  readonly name = 'constraint';

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const constraintWeight = weights.constraint;

    const baseScore = 100;
    const penaltiesApplied: { label: string; points: number }[] = [];
    const matchedFactors: string[] = [];

    const constraints = student.constraints;
    const eligibility = career.eligibility;

    if (constraints) {
      // 1. Budget Tier Match (Higher tier = more budget available)
      const studentBudget = constraints.budget_tier ?? 4;
      const careerMaxBudget = eligibility?.max_budget_tier ?? 4;

      if (studentBudget < careerMaxBudget) {
        const diff = careerMaxBudget - studentBudget;
        if (diff === 1) {
          penaltiesApplied.push({
            label: 'Available budget tier is slightly below typical cost — government quota or scholarship pathways can help close this gap.',
            points: 10,
          });
        } else {
          penaltiesApplied.push({
            label: 'Significant budget tier gap — government quota, education loans, or scholarship paths will be highly important to make this reachable.',
            points: 25,
          });
        }
      } else {
        matchedFactors.push('Budget profile matches the cost tier of this career');
      }

      // 2. Study Duration Match
      const studentMaxDuration = constraints.study_duration_max ?? 5;
      const careerMinDuration = eligibility?.min_study_duration_years ?? 3;

      if (studentMaxDuration < careerMinDuration) {
        penaltiesApplied.push({
          label: 'Typical study duration is longer than preferred — bridge programs or part-time learning paths can help make this duration profile reachable.',
          points: 15,
        });
      } else {
        matchedFactors.push('Study duration fits within your limits');
      }

      // 3. Location / Relocate Match & Abroad Required
      const willingToRelocate = constraints.willing_to_relocate ?? true;
      const abroadOk = constraints.abroad_ok ?? false;
      const abroadRequired = eligibility?.abroad_required ?? false;

      if (abroadRequired && !abroadOk) {
        penaltiesApplied.push({
          label: 'Requires study or work abroad — domestic alternatives in adjacent fields can provide a reachable pathway.',
          points: 20,
        });
      }

      if (!willingToRelocate && !abroadRequired) {
        // Assume non-remote categories like government_defence, or ITI, or science might need relocation
        const cat = career.category_code?.toLowerCase();
        if (cat === 'government_defence' || cat === 'science') {
          penaltiesApplied.push({
            label: 'Relocation may be required — local branch offices or remote-first roles in this domain would make this more reachable.',
            points: 10,
          });
        }
      }

      if (willingToRelocate) {
        matchedFactors.push('Willingness to relocate aligns well with typical job placements');
      }

      // 4. Govt vs Private preference match
      const govtPrivatePref = constraints.govt_vs_private ?? 'any';
      const cat = career.category_code?.toLowerCase();

      if (govtPrivatePref === 'govt' && cat !== 'government_defence') {
        penaltiesApplied.push({
          label: 'Private sector dominant — looking for public sector units (PSUs) or government contracts within this field would close the preference gap.',
          points: 15,
        });
      } else if (govtPrivatePref === 'private' && cat === 'government_defence') {
        penaltiesApplied.push({
          label: 'Government sector dominant — private consulting or private contractor roles adjacent to this field would make this more reachable.',
          points: 15,
        });
      } else if (govtPrivatePref !== 'any') {
        matchedFactors.push('Sector preference aligns with this career type');
      }
    }

    const { score: finalScore, total: totalPenalties, labels } = this.applyPenalties(baseScore, penaltiesApplied, 40);

    const reasoning = [`Constraint suitability score of ${finalScore}% after evaluating lifestyle and financial match`];

    return {
      score: Math.round(finalScore),
      weight: constraintWeight,
      weightedScore: Number((finalScore * constraintWeight).toFixed(2)),
      confidence: constraints ? 100 : 30,
      bonuses: 0,
      penalties: totalPenalties,
      matchedFactors,
      missingFactors: labels,
      reasoning,
    };
  }
}
