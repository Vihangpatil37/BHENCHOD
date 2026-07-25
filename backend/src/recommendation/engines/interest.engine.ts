// engines/interest.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { cosineSimilarity } from '../../common/vector-math';
import { getWeights } from '../utils/weight-calculator';

export const INTEREST_KEYS = [
  'technology',
  'business',
  'helping_people',
  'teaching',
  'nature',
  'research',
  'sports',
  'design',
  'media',
  'government',
  'finance',
  'machines',
];

@Injectable()
export class InterestEngine extends BaseScoringEngine {
  readonly name = 'interest';

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const interestWeight = weights.interest;

    // 1. Build Student Interest Vector
    const studentInterests = student.interests || {};
    const studentVector = INTEREST_KEYS.map((key) => {
      // Map schema fields which might have different camelCase names
      if (key === 'helping_people') {
        return (studentInterests as any).helping_people ?? 0;
      }
      return (studentInterests as any)[key] ?? 0;
    });

    // 2. Build Career Interest Vector dynamically
    const careerVector = this.getCareerInterestVector(career);

    // 3. Compute cosine similarity
    // Choice documented: We use cosine similarity to assess profile-to-profile vector overlap,
    // which remains consistent with the Personality Engine similarity calculation.
    const similarity = cosineSimilarity(studentVector, careerVector);
    const score = Math.round(similarity * 100);

    // Gather matched and missing factors
    const matchedFactors: string[] = [];
    const missingFactors: string[] = [];

    // Identify top student interests and compare with career required interests
    const sortedStudent = INTEREST_KEYS.map((key, i) => ({
      key,
      score: studentVector[i],
    })).sort((a, b) => b.score - a.score);

    const sortedCareer = INTEREST_KEYS.map((key, i) => ({
      key,
      score: careerVector[i],
    })).sort((a, b) => b.score - a.score);

    const topStudent = sortedStudent.slice(0, 3).map((x) => x.key);
    const topCareer = sortedCareer.slice(0, 3).map((x) => x.key);

    const common = topStudent.filter((x) => {
      const idx = INTEREST_KEYS.indexOf(x);
      return topCareer.includes(x) && studentVector[idx] >= 50;
    });
    if (common.length > 0) {
      matchedFactors.push(`Shared interest in: ${common.join(', ')}`);
    } else {
      missingFactors.push(
        `Your top interests (${topStudent.slice(0, 2).join(', ')}) do not strongly overlap with typical career drivers`,
      );
    }

    const reasoning = [
      `Interest similarity score of ${score}% based on vector overlap`,
    ];

    return {
      score,
      weight: interestWeight,
      weightedScore: Number((score * interestWeight).toFixed(2)),
      confidence: student.interests ? 100 : 30,
      bonuses: 0,
      penalties: 0,
      matchedFactors,
      missingFactors,
      reasoning,
    };
  }

  private getCareerInterestVector(career: CareerDocument): number[] {
    const vector = new Array(INTEREST_KEYS.length).fill(10); // baseline low score

    const setVal = (key: string, val: number) => {
      const idx = INTEREST_KEYS.indexOf(key);
      if (idx !== -1) {
        vector[idx] = Math.max(vector[idx], val);
      }
    };

    // Category mappings
    const cat = career.category_code?.toLowerCase();
    if (cat === 'science') {
      setVal('research', 90);
      setVal('technology', 70);
      setVal('machines', 50);
    } else if (cat === 'commerce') {
      setVal('business', 90);
      setVal('finance', 90);
    } else if (cat === 'arts_humanities') {
      setVal('design', 80);
      setVal('media', 70);
      setVal('helping_people', 60);
      setVal('teaching', 60);
    } else if (cat === 'diploma') {
      setVal('machines', 80);
      setVal('technology', 70);
    } else if (cat === 'iti_polytechnic') {
      setVal('machines', 90);
      setVal('technology', 40);
    } else if (cat === 'vocational') {
      setVal('design', 60);
      setVal('helping_people', 50);
      setVal('machines', 50);
      setVal('business', 50);
    } else if (cat === 'government_defence') {
      setVal('government', 90);
      setVal('sports', 60);
    } else if (cat === 'emerging_future') {
      setVal('technology', 90);
      setVal('research', 80);
      setVal('business', 60);
    }

    // Name keyword mappings
    const name = career.name?.toLowerCase() || '';
    if (
      name.includes('teach') ||
      name.includes('professor') ||
      name.includes('educator')
    ) {
      setVal('teaching', 90);
    }
    if (
      name.includes('design') ||
      name.includes('art') ||
      name.includes('architect') ||
      name.includes('creative')
    ) {
      setVal('design', 90);
    }
    if (
      name.includes('media') ||
      name.includes('writer') ||
      name.includes('journal') ||
      name.includes('film')
    ) {
      setVal('media', 90);
    }
    if (
      name.includes('finance') ||
      name.includes('bank') ||
      name.includes('account') ||
      name.includes('audit')
    ) {
      setVal('finance', 90);
    }
    if (
      name.includes('doctor') ||
      name.includes('nurse') ||
      name.includes('counsel') ||
      name.includes('therapy') ||
      name.includes('medicine')
    ) {
      setVal('helping_people', 90);
    }
    if (
      name.includes('manager') ||
      name.includes('business') ||
      name.includes('executive') ||
      name.includes('entrepreneur')
    ) {
      setVal('business', 90);
    }
    if (
      name.includes('sport') ||
      name.includes('athlete') ||
      name.includes('coach') ||
      name.includes('physical')
    ) {
      setVal('sports', 90);
    }
    if (
      name.includes('developer') ||
      name.includes('code') ||
      name.includes('software') ||
      name.includes('computer') ||
      name.includes('data')
    ) {
      setVal('technology', 90);
    }
    if (
      name.includes('research') ||
      name.includes('science') ||
      name.includes('scientist')
    ) {
      setVal('research', 90);
    }
    if (
      name.includes('engineer') ||
      name.includes('mechanic') ||
      name.includes('electric') ||
      name.includes('technician')
    ) {
      setVal('machines', 90);
    }
    if (
      name.includes('nature') ||
      name.includes('agri') ||
      name.includes('farm') ||
      name.includes('environ') ||
      name.includes('forest')
    ) {
      setVal('nature', 90);
    }
    if (
      name.includes('police') ||
      name.includes('army') ||
      name.includes('defence') ||
      name.includes('naval') ||
      name.includes('officer')
    ) {
      setVal('government', 90);
    }

    return vector;
  }
}
