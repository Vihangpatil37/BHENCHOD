// engines/base-scoring.engine.ts
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { RecommendationEngine } from '../interfaces/engine.interface';

export abstract class BaseScoringEngine implements RecommendationEngine {
  abstract readonly name: string;
  readonly version = 'v2';

  protected normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return this.clamp(((value - min) / (max - min)) * 100, 0, 100);
  }

  protected clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }

  protected applyBonuses(
    base: number,
    bonuses: { label: string; points: number }[],
    cap = 15,
  ): { score: number; total: number; labels: string[] } {
    const total = this.clamp(
      bonuses.reduce((sum, b) => sum + b.points, 0),
      0,
      cap,
    );
    return {
      score: this.clamp(base + total),
      total,
      labels: bonuses.map((b) => b.label),
    };
  }

  protected applyPenalties(
    base: number,
    penalties: { label: string; points: number }[],
    cap = 40,
  ): { score: number; total: number; labels: string[] } {
    const total = this.clamp(
      penalties.reduce((sum, p) => sum + p.points, 0),
      0,
      cap,
    );
    return {
      score: this.clamp(base - total),
      total,
      labels: penalties.map((p) => p.label),
    };
  }

  abstract calculate(
    student: StudentProfile,
    career: CareerDocument,
  ): Promise<ScoreBreakdown> | ScoreBreakdown;
}
