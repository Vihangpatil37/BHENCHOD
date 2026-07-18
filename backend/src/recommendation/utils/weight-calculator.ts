// utils/weight-calculator.ts
import * as fs from 'fs';
import * as path from 'path';
import { THRESHOLDS } from '../config/thresholds';

export interface RecommendationWeights {
  academic: number;
  interest: number;
  skill: number;
  personality: number;
  constraint: number;
  opportunity: number;
}

export function validateWeights(weights: RecommendationWeights): boolean {
  if (weights.opportunity > THRESHOLDS.OPPORTUNITY_WEIGHT_HARD_CEILING) {
    return false;
  }
  const sum =
    weights.academic +
    weights.interest +
    weights.skill +
    weights.personality +
    weights.constraint +
    weights.opportunity;
  // Allow for float precision issues
  return Math.abs(sum - 1.0) < 0.0001;
}

export function getWeights(): RecommendationWeights {
  const jsonPath = path.resolve(__dirname, '../config/recommendation-weights.v1.json');
  if (!fs.existsSync(jsonPath)) {
    return {
      academic: 0.25,
      interest: 0.20,
      skill: 0.20,
      personality: 0.15,
      constraint: 0.10,
      opportunity: 0.10,
    };
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const w = JSON.parse(raw);

  const weights: RecommendationWeights = {
    academic: typeof w.academic === 'number' ? w.academic : 0.25,
    interest: typeof w.interest === 'number' ? w.interest : 0.20,
    skill: typeof w.skill === 'number' ? w.skill : 0.20,
    personality: typeof w.personality === 'number' ? w.personality : 0.15,
    constraint: typeof w.constraint === 'number' ? w.constraint : 0.10,
    opportunity: typeof w.opportunity === 'number' ? w.opportunity : 0.10,
  };

  if (!validateWeights(weights)) {
    throw new Error('Invalid recommendation weights in configuration.');
  }

  return weights;
}
