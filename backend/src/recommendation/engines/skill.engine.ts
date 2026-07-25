// engines/skill.engine.ts
import { Injectable } from '@nestjs/common';
import { BaseScoringEngine } from './base-scoring.engine';
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { cosineSimilarity } from '../../common/vector-math';
import { getWeights } from '../utils/weight-calculator';

export const SKILL_KEYS = [
  'communication',
  'leadership',
  'problem_solving',
  'creativity',
  'logical_thinking',
  'coding',
  'drawing',
  'math',
  'observation',
  'patience',
];

@Injectable()
export class SkillEngine extends BaseScoringEngine {
  readonly name = 'skill';

  calculate(student: StudentProfile, career: CareerDocument): ScoreBreakdown {
    const weights = getWeights();
    const skillWeight = weights.skill;

    // 1. Build Student Skill Vector (1–5 scale normalized to 0–100)
    const studentSkills = student.skills || {};
    const studentVector = SKILL_KEYS.map((key) => {
      const val = (studentSkills as any)[key] ?? 3; // default to moderate skill (3) if missing
      return val * 20; // 1-5 scale normalized to 20-100
    });

    // 2. Build Career Skill Vector dynamically
    const careerVector = this.getCareerSkillVector(career);

    // 3. Compute cosine similarity
    const similarity = cosineSimilarity(studentVector, careerVector);
    const score = Math.round(similarity * 100);

    // Gather matched and missing factors
    const matchedFactors: string[] = [];
    const missingFactors: string[] = [];

    // Find top student skills and compare to career requirements
    const sortedStudent = SKILL_KEYS.map((key, i) => ({
      key,
      val: studentVector[i],
    })).sort((a, b) => b.val - a.val);

    const requiredCareerSkills = SKILL_KEYS.filter(
      (_, i) => careerVector[i] > 50,
    );

    const topSkills = sortedStudent.slice(0, 3).map((x) => x.key);
    const matchingRequired = topSkills.filter((x) =>
      requiredCareerSkills.includes(x),
    );

    if (matchingRequired.length > 0) {
      matchedFactors.push(
        `Your strong skills in ${matchingRequired.join(', ')} match career requirements`,
      );
    }

    const missingRequired = requiredCareerSkills.filter(
      (x) => !topSkills.includes(x),
    );
    if (missingRequired.length > 0) {
      missingFactors.push(
        `Consider developing your skills in: ${missingRequired.slice(0, 2).join(', ')}`,
      );
    }

    const reasoning = [
      `Skill similarity score of ${score}% based on vector overlap`,
    ];

    return {
      score,
      weight: skillWeight,
      weightedScore: Number((score * skillWeight).toFixed(2)),
      confidence: student.skills ? 100 : 30,
      bonuses: 0,
      penalties: 0,
      matchedFactors,
      missingFactors,
      reasoning,
    };
  }

  private getCareerSkillVector(career: CareerDocument): number[] {
    const vector = new Array(SKILL_KEYS.length).fill(20); // baseline low

    const setVal = (key: string, val: number) => {
      const idx = SKILL_KEYS.indexOf(key);
      if (idx !== -1) {
        vector[idx] = Math.max(vector[idx], val);
      }
    };

    // 1. Process explicit required_skills strings from DB
    const reqSkills = [
      ...(career.required_skills || []),
      ...(career.technical_skills || []),
      ...(career.soft_skills || []),
    ].map((s) => s.toLowerCase());

    for (const skill of reqSkills) {
      if (
        skill.includes('code') ||
        skill.includes('program') ||
        skill.includes('develop') ||
        skill.includes('software')
      ) {
        setVal('coding', 100);
      }
      if (
        skill.includes('math') ||
        skill.includes('quant') ||
        skill.includes('stat') ||
        skill.includes('calculus')
      ) {
        setVal('math', 100);
      }
      if (
        skill.includes('communicat') ||
        skill.includes('speak') ||
        skill.includes('writ') ||
        skill.includes('present')
      ) {
        setVal('communication', 100);
      }
      if (
        skill.includes('lead') ||
        skill.includes('manag') ||
        skill.includes('team') ||
        skill.includes('strateg')
      ) {
        setVal('leadership', 100);
      }
      if (
        skill.includes('problem') ||
        skill.includes('solv') ||
        skill.includes('analyt') ||
        skill.includes('think')
      ) {
        setVal('problem_solving', 100);
      }
      if (
        skill.includes('logic') ||
        skill.includes('reason') ||
        skill.includes('critic')
      ) {
        setVal('logical_thinking', 100);
      }
      if (
        skill.includes('creat') ||
        skill.includes('design') ||
        skill.includes('innov') ||
        skill.includes('art')
      ) {
        setVal('creativity', 100);
      }
      if (
        skill.includes('draw') ||
        skill.includes('sketch') ||
        skill.includes('illustrat')
      ) {
        setVal('drawing', 100);
      }
      if (
        skill.includes('observ') ||
        skill.includes('detail') ||
        skill.includes('research') ||
        skill.includes('attent')
      ) {
        setVal('observation', 100);
      }
      if (
        skill.includes('patient') ||
        skill.includes('counsel') ||
        skill.includes('care') ||
        skill.includes('help')
      ) {
        setVal('patience', 100);
      }
    }

    // 2. Default fallback by category if vector is still empty/low
    const cat = career.category_code?.toLowerCase();
    if (cat === 'science' || cat === 'emerging_future') {
      setVal('problem_solving', 80);
      setVal('logical_thinking', 80);
      setVal('math', 60);
    } else if (cat === 'commerce') {
      setVal('communication', 80);
      setVal('problem_solving', 70);
      setVal('math', 60);
    } else if (cat === 'arts_humanities') {
      setVal('creativity', 85);
      setVal('communication', 80);
    } else if (cat === 'diploma' || cat === 'iti_polytechnic') {
      setVal('problem_solving', 70);
      setVal('observation', 80);
    }

    return vector;
  }
}
