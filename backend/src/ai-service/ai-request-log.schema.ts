import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AIRequestLogDocument = AIRequestLog & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'ai_request_logs',
})
export class AIRequestLog {
  @Prop({ required: true })
  task_type: string; // e.g. "career_recommendation" | "counselor_chat" | etc.

  @Prop({ required: true })
  provider: string; // e.g. "gemini" | "groq" | etc.

  @Prop({ required: true })
  model: string;

  @Prop({ required: true, default: 0 })
  input_tokens: number;

  @Prop({ required: true, default: 0 })
  output_tokens: number;

  @Prop({ required: true, default: 0 })
  latency_ms: number;

  @Prop({ required: true, default: true })
  success: boolean;

  @Prop({ required: true, default: false })
  fallback_used: boolean;

  @Prop({ required: true, default: false })
  cached: boolean;
}

export const AIRequestLogSchema: MongooseSchema = SchemaFactory.createForClass(AIRequestLog);
