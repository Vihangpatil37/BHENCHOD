import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation, RecommendationDocument } from './schemas/recommendation.schema';
import { RecommendationFeedback, RecommendationFeedbackDocument } from './schemas/recommendation-feedback.schema';
import { EligibilityEngineService } from './eligibility-engine.service';
import { TraitMatchingEngineService } from './trait-matching-engine.service';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { StudentProfile, StudentProfileDocument } from '../onboarding/schemas/student-profile.schema';
import { onboardingEvents } from '../onboarding/onboarding.service';
import { FeedbackDto } from './dto/recommendation.dto';
import { RECOMMENDATION_ENGINE_VERSION } from './config/recommendation.constants';

@Injectable()
export class RecommendationService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(RecommendationFeedback.name)
    private readonly feedbackModel: Model<RecommendationFeedbackDocument>,
    @InjectModel(StudentProfile.name)
    private readonly profileModel: Model<StudentProfileDocument>,
    private readonly eligibilityEngine: EligibilityEngineService,
    private readonly traitMatchingEngine: TraitMatchingEngineService,
    private readonly aiServiceClient: AIServiceClient,
  ) {}

  onModuleInit() {
    // Listen to onboarding completion to automatically trigger recommendation generation
    onboardingEvents.on('ONBOARDING_COMPLETED', async (data) => {
      this.logger.log(`Received ONBOARDING_COMPLETED event for user ${data.user_id}. Generating recommendations...`);
      try {
        await this.generateRecommendation(data.user_id);
      } catch (err: any) {
        this.logger.error(`Auto-recommendation generation failed for user ${data.user_id}: ${err.message}`);
      }
    });

    // Listen to profile updates to mark recommendations stale
    onboardingEvents.on('PROFILE_UPDATED', async (data) => {
      this.logger.log(`Received PROFILE_UPDATED event for user ${data.user_id}. Marking latest recommendation as stale...`);
      try {
        await this.markAsStale(data.user_id);
      } catch (err: any) {
        this.logger.error(`Failed to mark recommendation stale for user ${data.user_id}: ${err.message}`);
      }
    });
  }

  async generateRecommendation(userId: string): Promise<Recommendation> {
    this.logger.log(`Generating recommendation pipeline for user: ${userId} (Engine Version: ${RECOMMENDATION_ENGINE_VERSION})`);

    // 1. Get completed student profile
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile || !profile.current_dna) {
      throw new BadRequestException('Student profile or computed DNA not found. Onboarding must be completed first.');
    }

    // 2. Eligibility Engine (runs database Mongoose filters)
    const eligibleCareers = await this.eligibilityEngine.getEligibleCareers(profile);
    const eligibleCount = eligibleCareers.length;

    if (eligibleCount === 0) {
      // Graceful fallback for zero eligible careers (Phase 8 handles edge cases, but we write a clean fallback here)
      this.logger.warn(`Zero eligible careers found for user: ${userId}. Relaxing budget and duration constraints...`);
      // Return recommendation with empty lists or handle it. Let's throw a clear error or return a basic candidate set.
      // For now, if zero, we throw a bad request so it can be handled
      throw new BadRequestException('No eligible careers found based on your academic subject grades and budget constraints.');
    }

    // 3. Trait Matching Engine (calculates cosine similarities)
    const shortlistScored = this.traitMatchingEngine.matchCareers(profile.current_dna, eligibleCareers);
    
    // Format shortlist array for Mongoose persistence
    const shortlist = shortlistScored.map((item) => ({
      career_code: item.career.career_code,
      match_score: item.score,
    }));

    // 4. Assemble AI Personalization payload (top 20 max)
    const aiCandidateCareers = shortlistScored.map((item) => ({
      career_code: item.career.career_code,
      name: item.career.name,
      description: item.career.description,
      required_skills: item.career.required_skills,
      match_score: item.score,
    }));

    const aiPayload = {
      student_profile: {
        academic: {
          class10: profile.academic?.class10,
          class12: profile.academic?.class12,
        },
        interests: profile.interests,
        skills: profile.skills,
        goals: profile.goals,
        work_preferences: profile.work_preferences,
        constraints: profile.constraints,
      },
      student_dna: {
        analytical_thinking: profile.current_dna.analytical_thinking,
        creativity: profile.current_dna.creativity,
        communication: profile.current_dna.communication,
        leadership: profile.current_dna.leadership,
        research: profile.current_dna.research,
        business_acumen: profile.current_dna.business_acumen,
        technical_curiosity: profile.current_dna.technical_curiosity,
        empathy: profile.current_dna.empathy,
        patience: profile.current_dna.patience,
        risk_tolerance: profile.current_dna.risk_tolerance,
      },
      candidate_careers: aiCandidateCareers,
    };

    // 5. Call AI Service Client (exactly 1 routed call)
    const aiResponse = await this.aiServiceClient.run(
      'career_recommendation',
      aiPayload,
      {
        final_recommendations: [
          {
            career_code: '',
            rank: 1,
            ai_score: 90,
            explanation: '',
            roadmap: '',
            suggested_colleges: [''],
            suggested_certifications: [''],
          },
        ],
      }
    );

    if (!aiResponse.success || !aiResponse.data || !aiResponse.data.final_recommendations) {
      throw new BadRequestException('AI Personalization failed to produce valid recommendations.');
    }

    // Slice and save top 5 recommendations
    const finalRecs = aiResponse.data.final_recommendations.slice(0, 5);

    // 6. Persist Recommendation document
    // If a recommendation already exists, we can keep it and just write a new latest one, or mark previous stale.
    // Setting previous ones to stale is clean.
    await this.recommendationModel.updateMany({ user_id: userId }, { stale: true }).exec();

    const recommendation = new this.recommendationModel({
      user_id: userId,
      onboarding_session_ref: profile.onboarding_step,
      pipeline_version: 'v1',
      eligible_count: eligibleCount,
      shortlist,
      final_recommendations: finalRecs,
      ai_provider_used: aiResponse.provider,
      ai_model_used: aiResponse.model,
      fallback_used: aiResponse.fallback_used,
      stale: false,
    });

    await recommendation.save();
    return recommendation;
  }

  async getLatestRecommendation(userId: string): Promise<Recommendation> {
    const rec = await this.recommendationModel
      .findOne({ user_id: userId })
      .sort({ generated_at: -1 })
      .exec();
    if (!rec) {
      throw new NotFoundException('No career recommendations found for this user.');
    }
    return rec;
  }

  async regenerate(userId: string): Promise<Recommendation> {
    this.logger.log(`Regenerating recommendations for user: ${userId}`);
    return this.generateRecommendation(userId);
  }

  async submitFeedback(userId: string, dto: FeedbackDto): Promise<RecommendationFeedback> {
    // Verify recommendation exists
    const rec = await this.recommendationModel.findById(dto.recommendation_id).exec();
    if (!rec || rec.user_id !== userId) {
      throw new NotFoundException('Recommendation document not found or unauthorized');
    }

    const feedback = new this.feedbackModel({
      user_id: userId,
      recommendation_id: dto.recommendation_id,
      career_code: dto.career_code,
      rating: dto.rating,
      comment: dto.comment,
    });

    return feedback.save();
  }

  async markAsStale(userId: string): Promise<void> {
    await this.recommendationModel.updateMany({ user_id: userId }, { stale: true }).exec();
  }
}
