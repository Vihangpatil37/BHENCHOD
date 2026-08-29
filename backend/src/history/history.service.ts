import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentDNAHistory } from '../onboarding/schemas/student-dna-history.schema';
import { Recommendation } from '../recommendation/schemas/recommendation.schema';
import { SavedCareer } from '../careers/schemas/saved-career.schema';
import { Career } from '../careers/schemas/career.schema';

export interface HistoryItem {
  type: 'onboarding' | 'recommendation' | 'saved_career';
  timestamp: Date;
  title: string;
  detail: any;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(StudentDNAHistory.name)
    private readonly dnaHistoryModel: Model<any>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<any>,
    @InjectModel(SavedCareer.name)
    private readonly savedCareerModel: Model<any>,
    @InjectModel(Career.name) private readonly careerModel: Model<any>,
  ) {}

  async getHistory(
    userId: string,
    type: string,
    page = 1,
    limit = 10,
  ): Promise<{
    items: HistoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Clamp limit to prevent memory DoS
    limit = Math.min(Math.max(1, limit), 100);
    this.logger.log(
      `Fetching history type=${type} page=${page} for user: ${userId}`,
    );

    let items: HistoryItem[] = [];

    const onboardingHistoryPromise = (async (): Promise<HistoryItem[]> => {
      if (type !== 'all' && type !== 'onboarding') return [];
      const records = await this.dnaHistoryModel
        .find({ user_id: userId })
        .sort({ computed_at: -1 })
        .exec();
      return records.map((r) => ({
        type: 'onboarding',
        timestamp: r.computed_at || r.created_at,
        title: `Onboarding completed (DNA snapshot generated)`,
        detail: {
          trigger: r.trigger,
          dna: r.dna_snapshot,
        },
      }));
    })();

    const recommendationsHistoryPromise = (async (): Promise<HistoryItem[]> => {
      if (type !== 'all' && type !== 'recommendations') return [];
      const records = await this.recommendationModel
        .find({ user_id: userId })
        .sort({ generated_at: -1 })
        .exec();
      return records.map((r) => ({
        type: 'recommendation',
        timestamp: r.generated_at,
        title: `Recommendation generated (${r.eligible_count} eligible careers)`,
        detail: {
          recommendation_id: r._id,
          top_careers: r.final_recommendations.map((fr: any) => fr.career_code),
          stale: r.stale,
        },
      }));
    })();

    const savedCareersHistoryPromise = (async (): Promise<HistoryItem[]> => {
      if (type !== 'all' && type !== 'careers') return [];
      const records = await this.savedCareerModel
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .exec();

      // Look up names of careers
      const careerCodes = records.map((r) => r.career_code);
      const careers = await this.careerModel
        .find({ career_code: { $in: careerCodes } })
        .exec();
      const nameMap = careers.reduce(
        (acc, curr) => {
          acc[curr.career_code] = curr.name;
          return acc;
        },
        {} as Record<string, string>,
      );

      return records.map((r) => ({
        type: 'saved_career',
        timestamp: r.created_at,
        title: `Saved career bookmark: ${nameMap[r.career_code] || r.career_code.replace('_', ' ')}`,
        detail: {
          career_code: r.career_code,
        },
      }));
    })();

    // Run parallel queries
    const [onboard, recs, saved] = await Promise.all([
      onboardingHistoryPromise,
      recommendationsHistoryPromise,
      savedCareersHistoryPromise,
    ]);

    // Merge and sort
    items = [...onboard, ...recs, ...saved].sort((a, b) => {
      const timeA =
        a.timestamp instanceof Date
          ? a.timestamp.getTime()
          : new Date(a.timestamp).getTime();
      const timeB =
        b.timestamp instanceof Date
          ? b.timestamp.getTime()
          : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    const total = items.length;

    // Paginate manually
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
    };
  }
}
