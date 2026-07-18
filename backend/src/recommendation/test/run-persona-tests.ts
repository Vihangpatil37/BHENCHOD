// test/run-persona-tests.ts
import { StudentProfile } from '../../onboarding/schemas/student-profile.schema';
import { CareerDocument } from '../../careers/schemas/career.schema';
import { AcademicEngine } from '../engines/academic.engine';
import { InterestEngine } from '../engines/interest.engine';
import { SkillEngine } from '../engines/skill.engine';
import { PersonalityEngine } from '../engines/personality.engine';
import { ConstraintEngine } from '../engines/constraint.engine';
import { OpportunityEngine } from '../engines/opportunity.engine';
import { HybridRankingEngine } from '../engines/hybrid-ranking.engine';
import { DiversityEngine } from '../engines/diversity.engine';
import { ConfidenceEngine } from '../engines/confidence.engine';
import { ExplainabilityEngine } from '../engines/explainability.engine';

// Mock TraitMatchingEngineService for personality calculation
const mockTraitMatchingEngineService = {
  matchCareers: (dna: any, career: any) => {
    // Return mock match based on traits
    return [{ score: 85 }];
  },
} as any;

const academicEngine = new AcademicEngine();
const interestEngine = new InterestEngine();
const skillEngine = new SkillEngine();
const personalityEngine = new PersonalityEngine(mockTraitMatchingEngineService);
const constraintEngine = new ConstraintEngine();
const opportunityEngine = new OpportunityEngine();
const hybridRankingEngine = new HybridRankingEngine();
const diversityEngine = new DiversityEngine();
const confidenceEngine = new ConfidenceEngine();
const explainabilityEngine = new ExplainabilityEngine();

const careers: CareerDocument[] = [
  {
    career_code: 'se',
    name: 'Software Engineer',
    category_code: 'science',
    sub_domain_code: 'science_pcm',
    description: 'Code software apps.',
    required_skills: ['Coding', 'Problem solving'],
    eligibility: {
      required_stream: 'science',
      required_subjects: ['math'],
      max_budget_tier: 4,
      min_study_duration_years: 4,
    },
    trait_weights: {
      analytical_thinking: 90,
      technical_curiosity: 80,
    },
  } as unknown as CareerDocument,
  {
    career_code: 'doctor',
    name: 'Doctor',
    category_code: 'science',
    sub_domain_code: 'science_pcb',
    description: 'Treat patients.',
    required_skills: ['Research', 'Patience'],
    eligibility: {
      required_stream: 'science',
      required_subjects: ['biology'],
      max_budget_tier: 5,
      min_study_duration_years: 5,
    },
    trait_weights: {
      empathy: 95,
      patience: 90,
    },
  } as unknown as CareerDocument,
  {
    career_code: 'ca',
    name: 'Chartered Accountant',
    category_code: 'commerce',
    sub_domain_code: 'commerce_finance',
    description: 'Audit finances.',
    required_skills: ['Problem solving', 'Communication'],
    eligibility: {
      required_stream: 'commerce',
      max_budget_tier: 2,
      min_study_duration_years: 3,
    },
    trait_weights: {
      business_acumen: 85,
    },
  } as unknown as CareerDocument,
];

// Test function
function runPipeline(student: StudentProfile, studentName: string) {
  console.log(`\n================ RUNNING PIPELINE FOR: ${studentName} ================`);

  // 1. Eligibility Check
  const eligible = careers.filter(c => {
    // Simple mock eligibility checks matching eligibility.engine.ts
    const stream = student.academic?.class12?.stream;
    if (c.eligibility?.required_stream && c.eligibility.required_stream !== stream) return false;
    if (c.eligibility?.max_budget_tier && student.constraints?.budget_tier) {
      if (student.constraints.budget_tier < c.eligibility.max_budget_tier - 1) return false;
    }
    return true;
  });

  console.log(`Eligible Careers (${eligible.length}):`, eligible.map(c => c.name));

  // 2. Score Engines
  const scored = eligible.map(career => {
    const academicScore = academicEngine.calculate(student, career);
    const interestScore = interestEngine.calculate(student, career);
    const skillScore = skillEngine.calculate(student, career);
    const personalityScore = personalityEngine.calculate(student, career);
    const constraintScore = constraintEngine.calculate(student, career);
    const opportunityScore = opportunityEngine.calculate(student, career);

    const hybridInput = {
      academic: academicScore,
      interest: interestScore,
      skill: skillScore,
      personality: personalityScore,
      constraint: constraintScore,
      opportunity: opportunityScore,
    };

    const hybridResult = hybridRankingEngine.calculate(career.career_code, career.name, hybridInput);

    return {
      career_code: career.career_code,
      name: career.name,
      score: hybridResult.score,
      breakdown: hybridInput,
      career,
    };
  });

  // 3. Rank
  const ranked = hybridRankingEngine.rank(scored);
  console.log('Ranked Results:', ranked.map(r => `${r.name}: ${r.score}`));

  // 4. Diversify
  const diversityInput = (ranked as any[]).map(r => ({
    career: r.career,
    score: r.score,
    originalResult: r,
  }));
  const diversified = diversityEngine.diversify(diversityInput, 'balanced', 3);
  console.log('Diversified Results:', diversified.map(d => d.career.name));

  // 5. Confidence & Explainability
  const conf = confidenceEngine.calculate(student, ranked);
  console.log('Confidence Score:', conf);

  if (diversified.length > 0) {
    const top = diversified[0];
    const reason = explainabilityEngine.explain(top.originalResult, 1, conf);
    console.log('\nTop Recommendation Explainability Reasons:');
    console.log('  Primary reasons:', reason.primaryReasons);
    console.log('  Strengths:', reason.studentStrengths);
    console.log('  Improvement areas:', reason.improvementAreas);
  }
}

// RUN PERSONAS
const pcmStudent = {
  completion_percentage: 95,
  onboarding_step: 'complete',
  academic: {
    class12: {
      stream: 'science',
      subjects: [
        { name: 'math', score: 95 },
        { name: 'physics', score: 90 },
        { name: 'chemistry', score: 90 },
      ],
    },
  },
  interests: {
    technology: 95,
    coding: 90,
  },
  skills: {
    coding: 5,
    problem_solving: 5,
  },
  current_dna: {
    analytical_thinking: 90,
    technical_curiosity: 85,
  },
  constraints: {
    budget_tier: 4,
  },
} as unknown as StudentProfile;

const pcbStudent = {
  completion_percentage: 90,
  onboarding_step: 'complete',
  academic: {
    class12: {
      stream: 'science',
      subjects: [
        { name: 'biology', score: 95 },
        { name: 'physics', score: 85 },
        { name: 'chemistry', score: 90 },
      ],
    },
  },
  interests: {
    biology: 95,
    healthcare: 90,
  },
  skills: {
    research: 5,
    patience: 5,
  },
  current_dna: {
    empathy: 90,
    patience: 85,
  },
  constraints: {
    budget_tier: 5,
  },
} as unknown as StudentProfile;

const commerceStudent = {
  completion_percentage: 85,
  onboarding_step: 'complete',
  academic: {
    class12: {
      stream: 'commerce',
      subjects: [
        { name: 'accountancy', score: 85 },
        { name: 'business_studies', score: 80 },
      ],
    },
  },
  interests: {
    business: 90,
  },
  skills: {
    communication: 4,
    business_acumen: 4,
  },
  current_dna: {
    business_acumen: 85,
  },
  constraints: {
    budget_tier: 2,
  },
} as unknown as StudentProfile;

runPipeline(pcmStudent, 'Persona A (PCM Science Student)');
runPipeline(pcbStudent, 'Persona B (PCB Science Student)');
runPipeline(commerceStudent, 'Persona C (Low Budget Commerce Student)');
