import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';
import { AIRequestLog } from '../ai-service/ai-request-log.schema';
import { SavedCareer } from '../careers/schemas/saved-career.schema';
import { onboardingEvents } from '../onboarding/onboarding.service';
import { aiServiceEvents } from '../ai-service/retry-manager.service';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(AIRequestLog.name)
    private readonly aiLogModel: Model<any>, // Inject raw model to bypass type conflicts
    @InjectModel(SavedCareer.name)
    private readonly savedCareerModel: Model<any>,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing Analytics Event Listeners...');

    // 1. Listen to Onboarding Started
    onboardingEvents.on('ONBOARDING_STARTED', async (data) => {
      await this.trackEvent(data.user_id, 'ONBOARDING_STARTED', data);
    });

    // 2. Listen to Onboarding Step Completed
    onboardingEvents.on('ONBOARDING_STEP_COMPLETED', async (data) => {
      await this.trackEvent(data.user_id, 'ONBOARDING_STEP_COMPLETED', data);
    });

    // 3. Listen to Onboarding Completed
    onboardingEvents.on('ONBOARDING_COMPLETED', async (data) => {
      await this.trackEvent(data.user_id, 'ONBOARDING_COMPLETED', data);
    });

    // 4. Listen to AI Provider Fallback Triggers
    aiServiceEvents.on('AI_PROVIDER_FALLBACK_TRIGGERED', async (data) => {
      await this.trackEvent(data.user_id || 'system', 'AI_PROVIDER_FALLBACK_TRIGGERED', data);
    });
  }

  /**
   * Tracks an event. Wrapped in try/catch to log and swallow all failures,
   * guaranteeing that analytics tracking never breaks user-facing requests.
   */
  async trackEvent(userId: string | undefined, eventType: string, payload: Record<string, any>): Promise<void> {
    try {
      this.logger.log(`Logging analytics event: ${eventType} for user: ${userId || 'anonymous'}`);
      
      const event = new this.eventModel({
        user_id: userId,
        event_type: eventType,
        payload,
      });

      await event.save();
    } catch (err: any) {
      // Log error but swallow it to protect calling thread
      this.logger.error(`[Analytics Failure Swallowed] Failed to track event ${eventType}: ${err.message}`);
    }
  }

  async getUserEvents(userId: string): Promise<AnalyticsEvent[]> {
    return this.eventModel.find({ user_id: userId }).sort({ created_at: -1 }).exec();
  }

  async getPlatformStats() {
    const stats = await this.eventModel.aggregate([
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
    ]).exec();

    return stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getCareersStats() {
    const savedCount = await this.savedCareerModel.countDocuments().exec();
    const topSaved = await this.savedCareerModel.aggregate([
      { $group: { _id: '$career_code', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).exec();

    return {
      total_saved_bookmarks: savedCount,
      top_bookmarked_careers: topSaved.map((t) => ({ career_code: t._id, count: t.count })),
    };
  }

  async getAIStats() {
    const totalRequests = await this.aiLogModel.countDocuments().exec();
    
    // Average Latency & Success rate
    const aggregateData = await this.aiLogModel.aggregate([
      {
        $group: {
          _id: null,
          avg_latency: { $avg: '$latency_ms' },
          total_tokens: { $sum: { $add: ['$input_tokens', '$output_tokens'] } },
          success_count: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          fallback_count: { $sum: { $cond: [{ $eq: ['$fallback_used', true] }, 1, 0] } },
        },
      },
    ]).exec();

    const stats = aggregateData[0] || {
      avg_latency: 0,
      total_tokens: 0,
      success_count: 0,
      fallback_count: 0,
    };

    const successRate = totalRequests > 0 ? (stats.success_count / totalRequests) * 100 : 100;
    const fallbackRate = totalRequests > 0 ? (stats.fallback_count / totalRequests) * 100 : 0;

    return {
      total_api_requests: totalRequests,
      average_latency_ms: Math.round(stats.avg_latency),
      total_tokens_consumed: stats.total_tokens,
      success_rate_percentage: Math.round(successRate * 10) / 10,
      fallback_escalation_rate_percentage: Math.round(fallbackRate * 10) / 10,
    };
  }
}
