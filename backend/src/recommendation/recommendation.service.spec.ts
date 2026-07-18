import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { RecommendationService } from './recommendation.service';
import { EligibilityEngineService } from './eligibility-engine.service';
import { TraitMatchingEngineService } from './trait-matching-engine.service';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { StudentProfile } from '../onboarding/schemas/student-profile.schema';
import { onboardingEvents } from '../onboarding/onboarding.service';

import { AcademicEngine } from './engines/academic.engine';
import { InterestEngine } from './engines/interest.engine';
import { SkillEngine } from './engines/skill.engine';
import { PersonalityEngine } from './engines/personality.engine';
import { ConstraintEngine } from './engines/constraint.engine';
import { OpportunityEngine } from './engines/opportunity.engine';
import { HybridRankingEngine } from './engines/hybrid-ranking.engine';
import { DiversityEngine } from './engines/diversity.engine';
import { ConfidenceEngine } from './engines/confidence.engine';
import { ExplainabilityEngine } from './engines/explainability.engine';

jest.mock('./config/recommendation.constants', () => ({
  get RECOMMENDATION_ENGINE_VERSION() {
    return process.env.RECOMMENDATION_ENGINE_VERSION ?? 'v1';
  },
}));

const execMock = jest.fn();

const makeModel = () => {
  const fn: any = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(undefined);
  };
  const query = { exec: execMock, sort: () => query };
  fn.findOne = jest.fn(() => query);
  fn.findById = jest.fn(() => query);
  fn.find = jest.fn(() => query);
  fn.updateMany = jest.fn(() => query);
  return fn;
};

describe('RecommendationService', () => {
  let service: RecommendationService;
  let recModel: any;
  let feedbackModel: any;
  let profileModel: any;
  let eligibilityEngine: any;
  let traitMatchingEngine: any;
  let aiClient: any;

  const mockProfile = {
    user_id: 'user-1',
    onboarding_step: 'complete',
    current_dna: {
      analytical_thinking: 80, creativity: 50, communication: 60,
      leadership: 40, research: 70, business_acumen: 30,
      technical_curiosity: 90, empathy: 50, patience: 40, risk_tolerance: 50,
    },
    academic: { class10: { subjects: { maths: 80, science: 75 } } },
    interests: { technology: 90 },
    skills: { coding: 5 },
    goals: ['innovation'],
    work_preferences: ['remote'],
    constraints: { budget_tier: 3, study_duration_max: 4 },
  };

  const eligible = [
    { career_code: 'se', name: 'SE', description: '', required_skills: [], trait_weights: { analytical_thinking: 80 }, eligibility: {} },
    { career_code: 'ds', name: 'DS', description: '', required_skills: [], trait_weights: { analytical_thinking: 90 }, eligibility: {} },
  ];

  beforeEach(async () => {
    execMock.mockReset();
    recModel = makeModel();
    feedbackModel = makeModel();
    profileModel = makeModel();
    eligibilityEngine = { getEligibleCareers: jest.fn() };
    traitMatchingEngine = { matchCareers: jest.fn() };
    aiClient = { run: jest.fn() };

    const mockAcademicEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.25, weightedScore: 20, bonuses: 0, penalties: 0 }) };
    const mockInterestEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.2, weightedScore: 16, bonuses: 0, penalties: 0 }) };
    const mockSkillEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.2, weightedScore: 16, bonuses: 0, penalties: 0 }) };
    const mockPersonalityEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.15, weightedScore: 12, bonuses: 0, penalties: 0 }) };
    const mockConstraintEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.1, weightedScore: 8, bonuses: 0, penalties: 0 }) };
    const mockOpportunityEngine = { calculate: jest.fn().mockReturnValue({ score: 80, weight: 0.1, weightedScore: 8, bonuses: 0, penalties: 0 }) };
    const mockHybridRankingEngine = {
      calculate: jest.fn().mockReturnValue({ score: 80, totalBonuses: 0, totalPenalties: 0 }),
      rank: jest.fn().mockImplementation((x) => x),
    };
    const mockDiversityEngine = {
      diversify: jest.fn().mockImplementation((x) => x),
    };
    const mockConfidenceEngine = {
      calculate: jest.fn().mockReturnValue(85),
    };
    const mockExplainabilityEngine = {
      explain: jest.fn().mockReturnValue({
        careerId: 'se',
        careerName: 'Software Engineer',
        rank: 1,
        finalScore: 80,
        confidence: 85,
        primaryReasons: ['Interest aligns'],
        secondaryReasons: [],
        bonuses: [],
        penalties: [],
        studentStrengths: [],
        improvementAreas: [],
        comparisonSummary: '',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: getModelToken('Recommendation'), useValue: recModel },
        { provide: getModelToken('RecommendationFeedback'), useValue: feedbackModel },
        { provide: getModelToken(StudentProfile.name), useValue: profileModel },
        { provide: EligibilityEngineService, useValue: eligibilityEngine },
        { provide: TraitMatchingEngineService, useValue: traitMatchingEngine },
        { provide: AIServiceClient, useValue: aiClient },
        { provide: AcademicEngine, useValue: mockAcademicEngine },
        { provide: InterestEngine, useValue: mockInterestEngine },
        { provide: SkillEngine, useValue: mockSkillEngine },
        { provide: PersonalityEngine, useValue: mockPersonalityEngine },
        { provide: ConstraintEngine, useValue: mockConstraintEngine },
        { provide: OpportunityEngine, useValue: mockOpportunityEngine },
        { provide: HybridRankingEngine, useValue: mockHybridRankingEngine },
        { provide: DiversityEngine, useValue: mockDiversityEngine },
        { provide: ConfidenceEngine, useValue: mockConfidenceEngine },
        { provide: ExplainabilityEngine, useValue: mockExplainabilityEngine },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  describe('generateRecommendation', () => {
    it('throws when profile or DNA not found', async () => {
      execMock.mockResolvedValue(null);
      await expect(service.generateRecommendation('user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws when zero eligible careers', async () => {
      execMock.mockResolvedValue(mockProfile);
      eligibilityEngine.getEligibleCareers.mockResolvedValue([]);
      await expect(service.generateRecommendation('user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws when AI call fails', async () => {
      execMock.mockResolvedValue(mockProfile);
      eligibilityEngine.getEligibleCareers.mockResolvedValue(eligible);
      traitMatchingEngine.matchCareers.mockReturnValue(eligible.map(c => ({ career: c, score: 80 })));
      aiClient.run.mockResolvedValue({ success: false, data: null });
      await expect(service.generateRecommendation('user-1')).rejects.toThrow(BadRequestException);
    });

    it('saves recommendation with top 5 on success', async () => {
      execMock.mockResolvedValue(mockProfile);
      eligibilityEngine.getEligibleCareers.mockResolvedValue(eligible);
      traitMatchingEngine.matchCareers.mockReturnValue(eligible.map(c => ({ career: c, score: 85 })));
      aiClient.run.mockResolvedValue({
        success: true,
        data: { final_recommendations: [{ career_code: 'se', rank: 1, ai_score: 95, explanation: 'G', roadmap: 'R', suggested_colleges: [], suggested_certifications: [] }] },
        provider: 'gemini', model: 'g', fallback_used: false,
      });

      await service.generateRecommendation('user-1');
      expect(recModel.updateMany).toHaveBeenCalledWith({ user_id: 'user-1' }, { stale: true });
    });

    it('saves V2 recommendation on success with engine version v2', async () => {
      process.env.RECOMMENDATION_ENGINE_VERSION = 'v2';
      try {
        execMock.mockResolvedValue(mockProfile);
        eligibilityEngine.getEligibleCareers.mockResolvedValue(eligible);
        aiClient.run.mockResolvedValue({
          success: true,
          data: { final_recommendations: [{ career_code: 'se', rank: 1, ai_score: 95, explanation: 'G', roadmap: 'R', suggested_colleges: [], suggested_certifications: [] }] },
          provider: 'gemini', model: 'g', fallback_used: false,
        });

        // We wrap the returned recommendation mock behavior since our makeModel mock Assigns data to `this`
        // mock Model will be instantiated inside service. We want to check what arguments it was constructed with.
        const result = await service.generateRecommendation('user-1');
        expect(result.pipeline_version).toBe('v2');
      } finally {
        process.env.RECOMMENDATION_ENGINE_VERSION = 'v1';
      }
    });
  });

  describe('getLatestRecommendation', () => {
    it('throws when none exists', async () => {
      execMock.mockResolvedValue(null);
      await expect(service.getLatestRecommendation('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns latest', async () => {
      execMock.mockResolvedValue({ _id: 'rec-1', user_id: 'user-1', final_recommendations: [] });
      const result = await service.getLatestRecommendation('user-1');
      expect(result._id).toBe('rec-1');
    });
  });

  describe('submitFeedback', () => {
    it('throws when recommendation not found', async () => {
      execMock.mockResolvedValue(null);
      await expect(service.submitFeedback('user-1', { recommendation_id: 'bad', career_code: 'se', rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('saves feedback for correct user', async () => {
      execMock.mockResolvedValue({ _id: 'rec-1', user_id: 'user-1' });
      await service.submitFeedback('user-1', { recommendation_id: 'rec-1', career_code: 'se', rating: 5, comment: 'Nice' });
    });
  });

  describe('event hooks', () => {
    it('registers listeners when onModuleInit is called', () => {
      service.onModuleInit();
      const names = onboardingEvents.eventNames();
      expect(names).toContain('ONBOARDING_COMPLETED');
      expect(names).toContain('PROFILE_UPDATED');
    });
  });
});
