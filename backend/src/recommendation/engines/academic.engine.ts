// engines/academic.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { getWeights } from '../utils/weight-calculator';

@Injectable()
export class AcademicEngine extends BaseScoringEngine {
  readonly name = 'academic';

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const academicWeight = weights.academic;

    // 1. Gather inputs
    const class10 = student.academic?.class10;
    const class12 = student.academic?.class12;
    const stream = class12?.stream;

    const studentMaths = class10?.subjects?.maths ?? 0;
    const studentScience = class10?.subjects?.science ?? 0;
    const studentBiology = class10?.subjects?.computer ?? 0; // computer/biology proxy if not present
    const studentEnglish = class10?.subjects?.english ?? 0;

    const eligibility = career.eligibility;
    const minMaths = eligibility?.min_maths ?? 0;
    const minScience = eligibility?.min_science ?? 0;
    const minBiology = eligibility?.min_biology ?? 0;
    const minEnglish = eligibility?.min_english ?? 0;

    const matchedFactors: string[] = [];
    const missingFactors: string[] = [];
    const reasoning: string[] = [];

    // --- Component A: Required Subjects Match (60%) ---
    let reqCount = 0;
    let reqSum = 0;

    if (minMaths > 0) {
      reqCount++;
      const subjectScore =
        studentMaths >= minMaths ? 100 : (studentMaths / minMaths) * 100;
      reqSum += subjectScore;
      if (studentMaths >= minMaths) {
        matchedFactors.push(
          `Maths grade (${studentMaths}%) meets the minimum requirement of ${minMaths}%`,
        );
      } else {
        missingFactors.push(
          `Maths grade (${studentMaths}%) is below the minimum requirement of ${minMaths}%`,
        );
      }
    }
    if (minScience > 0) {
      reqCount++;
      const subjectScore =
        studentScience >= minScience
          ? 100
          : (studentScience / minScience) * 100;
      reqSum += subjectScore;
      if (studentScience >= minScience) {
        matchedFactors.push(
          `Science grade (${studentScience}%) meets the minimum requirement of ${minScience}%`,
        );
      } else {
        missingFactors.push(
          `Science grade (${studentScience}%) is below the minimum requirement of ${minScience}%`,
        );
      }
    }
    if (minBiology > 0) {
      reqCount++;
      const subjectScore =
        studentBiology >= minBiology
          ? 100
          : (studentBiology / minBiology) * 100;
      reqSum += subjectScore;
      if (studentBiology >= minBiology) {
        matchedFactors.push(
          `Biology grade (${studentBiology}%) meets the minimum requirement of ${minBiology}%`,
        );
      } else {
        missingFactors.push(
          `Biology grade (${studentBiology}%) is below the minimum requirement of ${minBiology}%`,
        );
      }
    }
    if (minEnglish > 0) {
      reqCount++;
      const subjectScore =
        studentEnglish >= minEnglish
          ? 100
          : (studentEnglish / minEnglish) * 100;
      reqSum += subjectScore;
      if (studentEnglish >= minEnglish) {
        matchedFactors.push(
          `English grade (${studentEnglish}%) meets the minimum requirement of ${minEnglish}%`,
        );
      } else {
        missingFactors.push(
          `English grade (${studentEnglish}%) is below the minimum requirement of ${minEnglish}%`,
        );
      }
    }

    const requiredSubjectsMatch = reqCount > 0 ? reqSum / reqCount : 100;

    // --- Component B: Overall Performance (20%) ---
    const overallPercentage = class12?.percentage || class10?.percentage || 0;
    if (overallPercentage >= 75) {
      matchedFactors.push(`High overall performance of ${overallPercentage}%`);
    } else if (overallPercentage > 0) {
      matchedFactors.push(`Overall performance is ${overallPercentage}%`);
    }
    const overallPerformance = overallPercentage;

    // --- Component C: Favorite Subjects Alignment (10%) ---
    const favorites = [
      ...(class12?.favorite_subjects || []),
      ...(class10?.favorite_subjects || []),
    ].map((s) => s.toLowerCase());

    let favoriteSubjectsAlignment = 0;
    if (favorites.length > 0) {
      const careerCat = career.category_code?.toLowerCase();
      let matchFound = false;

      if (
        careerCat === 'science' &&
        favorites.some((f) =>
          [
            'math',
            'mathematics',
            'science',
            'physics',
            'chemistry',
            'biology',
            'computer',
          ].some((k) => f.includes(k)),
        )
      ) {
        matchFound = true;
      } else if (
        careerCat === 'commerce' &&
        favorites.some((f) =>
          ['math', 'accounts', 'economics', 'business', 'finance'].some((k) =>
            f.includes(k),
          ),
        )
      ) {
        matchFound = true;
      } else if (
        careerCat === 'arts_humanities' &&
        favorites.some((f) =>
          [
            'english',
            'history',
            'geography',
            'social',
            'sst',
            'art',
            'music',
            'language',
          ].some((k) => f.includes(k)),
        )
      ) {
        matchFound = true;
      }

      favoriteSubjectsAlignment = matchFound ? 100 : 50;
      if (matchFound) {
        matchedFactors.push(
          'Academic interests align with this career category',
        );
      }
    } else {
      favoriteSubjectsAlignment = 0;
    }

    // --- Component D: Weak Subject Penalty (10%) ---
    const weak = [
      ...(class12?.weak_subjects || []),
      ...(class10?.weak_subjects || []),
    ].map((s) => s.toLowerCase());

    let weakSubjectPenalty = 100;
    const requiredList: string[] = [];
    if (minMaths > 0) requiredList.push('math');
    if (minScience > 0) requiredList.push('science');
    if (minBiology > 0) requiredList.push('biology');
    if (minEnglish > 0) requiredList.push('english');

    const hasWeakOverlap = weak.some((w) =>
      requiredList.some((r) => w.includes(r)),
    );
    if (hasWeakOverlap) {
      weakSubjectPenalty = 0;
      missingFactors.push('A required subject is marked as a weak area');
    }

    // Calculate base weighted score
    const baseScore =
      !class10 && !class12
        ? 20
        : requiredSubjectsMatch * 0.6 +
          overallPerformance * 0.2 +
          favoriteSubjectsAlignment * 0.1 +
          weakSubjectPenalty * 0.1;

    // --- Bonuses and Penalties ---
    const bonusesApplied: { label: string; points: number }[] = [];
    const penaltiesApplied: { label: string; points: number }[] = [];

    // Stream Match
    const requiredStream = eligibility?.required_stream;
    if (requiredStream && requiredStream !== 'any') {
      if (stream && stream.toLowerCase() === requiredStream.toLowerCase()) {
        bonusesApplied.push({
          label: `Matches required stream: ${requiredStream}`,
          points: 10,
        });
      } else if (stream) {
        penaltiesApplied.push({
          label: `Stream mismatch: requires ${requiredStream}`,
          points: 15,
        });
      }
    }

    const { score: scoreWithBonus, total: totalBonuses } = this.applyBonuses(
      baseScore,
      bonusesApplied,
    );
    const { score: finalScore, total: totalPenalties } = this.applyPenalties(
      scoreWithBonus,
      penaltiesApplied,
    );

    // Setup confidence
    let confidence = 100;
    if (!class10 && !class12) {
      confidence = 30; // low confidence if no academic data
      reasoning.push('No academic data available, defaulting to lower score');
    } else {
      reasoning.push('Academics evaluated successfully');
    }

    return {
      score: Math.round(finalScore),
      weight: academicWeight,
      weightedScore: Number((finalScore * academicWeight).toFixed(2)),
      confidence,
      bonuses: totalBonuses,
      penalties: totalPenalties,
      matchedFactors,
      missingFactors,
      reasoning,
    };
  }
}
