import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

@Schema({ _id: false })
export class ShortlistEntry {
  @Prop({ required: true })
  career_code: string;

  @Prop({ required: true })
  match_score: number; // 0 to 100
}

@Schema({ _id: false })
export class FinalRecommendation {
  @Prop({ required: true })
  career_code: string;

  @Prop({ required: true })
  rank: number; // 1 to 5

  @Prop({ required: true })
  ai_score: number; // 0 to 100

  @Prop({ required: true })
  explanation: string;

  @Prop({ required: true })
  roadmap: string;

  @Prop({ type: [String], required: true, default: [] })
  suggested_colleges: string[];

  @Prop({ type: [String], required: true, default: [] })
  suggested_certifications: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  score_breakdown?: any;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  reason?: any;
}

@Schema({
  timestamps: { createdAt: 'generated_at', updatedAt: false },
  collection: 'recommendations',
})
export class Recommendation {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped UUID

  @Prop({ required: false })
  onboarding_session_ref?: string;

  @Prop({ required: true, default: 'v1' })
  pipeline_version: string;

  @Prop({ required: true })
  eligible_count: number; // size after Eligibility Engine

  @Prop({ type: [SchemaFactory.createForClass(ShortlistEntry)], required: true, default: [] })
  shortlist: ShortlistEntry[]; // top 20 candidates

  @Prop({ type: [SchemaFactory.createForClass(FinalRecommendation)], required: true, default: [] })
  final_recommendations: FinalRecommendation[]; // top 5 ranked by AI

  @Prop({ required: true })
  ai_provider_used: string;

  @Prop({ required: true })
  ai_model_used: string;

  @Prop({ required: true, default: false })
  fallback_used: boolean;

  @Prop({ required: true, default: false })
  stale: boolean;

  @Prop({ required: false })
  recommendation_version?: string;

  @Prop({ required: false })
  engine_version?: string;

  @Prop({ required: false })
  weight_version?: string;

  @Prop({ required: false })
  processing_time_ms?: number;

  @Prop({ required: false })
  confidence_score?: number;

  generated_at?: Date;
}

export const RecommendationSchema: MongooseSchema = SchemaFactory.createForClass(Recommendation);
