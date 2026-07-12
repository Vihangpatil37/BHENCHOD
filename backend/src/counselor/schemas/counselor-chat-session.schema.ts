import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CounselorChatSessionDocument = CounselorChatSession & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'counselor_chat_sessions',
})
export class CounselorChatSession {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped UUID

  @Prop({ required: false, index: true })
  recommendation_ref?: string; // Reference to Recommendation._id

  @Prop({ required: true, default: 'New Career Counseling Session' })
  title: string;
}

export const CounselorChatSessionSchema: MongooseSchema = SchemaFactory.createForClass(CounselorChatSession);
