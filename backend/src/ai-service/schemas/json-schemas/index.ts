import { careerRecommendationSchema } from './career-recommendation.schema';
import { counselorChatSchema } from './counselor-chat.schema';
import { careerTraitBackfillSchema } from './career-trait-backfill.schema';
import { reportSummarySchema } from './report-summary.schema';
import { roadmapGenerationSchema } from './roadmap-generation.schema';
import { scenarioGenerationSchema } from './scenario-generation.schema';

export const schemaMap = new Map<string, object>([
  ['career_recommendation', careerRecommendationSchema],
  ['counselor_chat', counselorChatSchema],
  ['career_trait_backfill', careerTraitBackfillSchema],
  ['report_summary', reportSummarySchema],
  ['roadmap_generation', roadmapGenerationSchema],
  ['scenario_generation', scenarioGenerationSchema],
]);
