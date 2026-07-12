import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CounselorChatMessageDocument = CounselorChatMessage & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'counselor_chat_messages',
})
export class CounselorChatMessage {
  @Prop({ required: true, index: true })
  session_id: string; // reference to CounselorChatSession._id

  @Prop({ required: true, enum: ['student', 'counselor'] })
  sender: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 0 })
  token_count: number;
}

export const CounselorChatMessageSchema: MongooseSchema = SchemaFactory.createForClass(CounselorChatMessage);
