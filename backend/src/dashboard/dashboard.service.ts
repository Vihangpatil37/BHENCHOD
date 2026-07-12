import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from '../onboarding/schemas/student-profile.schema';
import { Recommendation, RecommendationDocument } from '../recommendation/schemas/recommendation.schema';
import { SavedCareer, SavedCareerDocument } from '../careers/schemas/saved-career.schema';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(StudentProfile.name) private readonly profileModel: Model<StudentProfileDocument>,
    @InjectModel(Recommendation.name) private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(SavedCareer.name) private readonly savedCareerModel: Model<SavedCareerDocument>,
  ) {}

  async getDashboardData(userId: string) {
    this.logger.log(`Fetching dashboard data for user: ${userId}`);

    // 1. Fetch data from DB
    const user = await this.userModel.findOne({ user_id: userId }).exec();
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    const recommendation = await this.recommendationModel
      .findOne({ user_id: userId })
      .sort({ generated_at: -1 })
      .exec();
    const savedCount = await this.savedCareerModel.countDocuments({ user_id: userId }).exec();
    const recentSaved = await this.savedCareerModel
      .find({ user_id: userId })
      .sort({ saved_at: -1 })
      .limit(3)
      .exec();

    // 2. Journey State Logic
    let journeyState = 'Login';
    let onboardingPercentage = 0;
    
    if (profile) {
      onboardingPercentage = profile.completion_percentage;
      if (profile.onboarding_step === 'complete') {
        if (savedCount > 0) {
          journeyState = 'Career Explorer';
        } else if (recommendation) {
          journeyState = 'Recommendation';
        } else {
          journeyState = 'Onboarding'; // Complete but no recommendation yet
        }
      } else {
        journeyState = 'Onboarding';
      }
    }

    // 3. Recommendation freshness
    const recAvailable = !!recommendation;
    const recStale = recommendation ? recommendation.stale : false;

    // 4. Server-Side Next Action
    let nextAction = 'Start your onboarding profile setup.';
    if (profile) {
      if (profile.onboarding_step !== 'complete') {
        nextAction = `Continue onboarding step: ${profile.onboarding_step}`;
      } else if (!recommendation) {
        nextAction = 'Generate your career recommendations.';
      } else if (recommendation.stale) {
        nextAction = 'Profile updated! Regenerate recommendations.';
      } else if (savedCount === 0) {
        nextAction = 'Review matches and bookmark (save) your first career.';
      } else {
        nextAction = 'Explore your matched colleges, roadmaps, or start counselor chat.';
      }
    }

    // 5. Server-Side AI Insight (Deterministic template matching)
    let aiInsight = 'Please complete the onboarding questionnaire so we can analyze your unique traits and suggest matching paths.';
    if (profile && profile.current_dna) {
      const dna = profile.current_dna;
      const sortedTraits = Object.entries({
        analytical_thinking: dna.analytical_thinking,
        creativity: dna.creativity,
        communication: dna.communication,
        leadership: dna.leadership,
        research: dna.research,
        business_acumen: dna.business_acumen,
        technical_curiosity: dna.technical_curiosity,
        empathy: dna.empathy,
        patience: dna.patience,
        risk_tolerance: dna.risk_tolerance,
      }).sort((a, b) => b[1] - a[1]);

      const topTrait1 = sortedTraits[0];
      const topTrait2 = sortedTraits[1];

      aiInsight = `Your traits showcase exceptional strength in ${topTrait1[0].replace('_', ' ')} (${topTrait1[1]}) and ${topTrait2[0].replace('_', ' ')} (${topTrait2[1]}). This highlights a strong fit for structured problem solving and critical analysis.`;
    }

    return {
      user: {
        email: user?.email,
        full_name: user?.full_name,
        user_id: userId,
      },
      journey: {
        current_state: journeyState, // "Login" | "Onboarding" | "Recommendation" | "Career Explorer"
        onboarding_percentage: onboardingPercentage,
      },
      recommendation: {
        available: recAvailable,
        stale: recStale,
        generated_at: recommendation?.generated_at || null,
        top_matches: recommendation?.final_recommendations?.slice(0, 3).map((r) => r.career_code) || [],
      },
      saved_careers: {
        count: savedCount,
        recent: recentSaved.map((s) => s.career_code),
      },
      next_action: nextAction,
      ai_insight: aiInsight,
    };
  }
}
