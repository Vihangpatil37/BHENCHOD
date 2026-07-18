// interfaces/score-breakdown.interface.ts
export interface ScoreBreakdown {
  score: number;              // 0–100, normalized
  weight: number;              // 0–1, this engine's contribution weight (from config)
  weightedScore: number;       // score * weight
  confidence: number;          // 0–100, this engine's own confidence in its inputs
  bonuses: number;             // total bonus points applied (post-cap)
  penalties: number;           // total penalty points applied (post-cap)
  matchedFactors: string[];
  missingFactors: string[];
  reasoning: string[];
}
