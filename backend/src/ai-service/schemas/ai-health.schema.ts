import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AiHealth extends Document {
  @Prop({ required: true })
  provider: string; // e.g., 'openai', 'anthropic', 'gemini'

  @Prop({ required: true })
  apiKeyPrefix: string; // Just to uniquely identify a key, e.g., first 8 chars

  @Prop({ default: 'healthy' })
  status: 'healthy' | 'rate_limited' | 'invalid' | 'disabled';

  @Prop()
  cooldownUntil: Date;

  @Prop({ default: 0 })
  errorCount: number;

  @Prop()
  lastError: string;
}

export const AiHealthSchema = SchemaFactory.createForClass(AiHealth);
