import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RecommendationFeedbackDocument = RecommendationFeedback & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'recommendation_feedbacks',
})
export class RecommendationFeedback {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped UUID

  @Prop({ required: true, index: true })
  recommendation_id: string; // reference to Recommendation._id

  @Prop({ required: true })
  career_code: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number; // 1 to 5 stars

  @Prop({ required: false })
  comment?: string;
}

export const RecommendationFeedbackSchema: MongooseSchema =
  SchemaFactory.createForClass(RecommendationFeedback);
