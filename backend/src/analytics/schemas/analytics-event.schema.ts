import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'analytics_events',
})
export class AnalyticsEvent {
  @Prop({ required: false, index: true })
  user_id?: string; // student user_id if logged in

  @Prop({ required: true, index: true })
  event_type: string; // e.g. "ONBOARDING_STARTED", "AI_PROVIDER_FALLBACK_TRIGGERED", etc.

  @Prop({
    type: MongooseSchema.Types.Map,
    of: MongooseSchema.Types.Mixed,
    required: true,
  })
  payload: Map<string, any>;
}

export const AnalyticsEventSchema: MongooseSchema =
  SchemaFactory.createForClass(AnalyticsEvent);
