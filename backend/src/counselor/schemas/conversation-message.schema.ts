import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConversationMessageDocument = ConversationMessage & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'conversation_messages',
})
export class ConversationMessage {
  @Prop({ required: true, index: true })
  conversation_id: string; // Reference to Conversation._id

  @Prop({ required: true, enum: ['student', 'counselor', 'user', 'assistant'] })
  role: string; // "student" (user) | "counselor" (assistant)

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 'general_chat' })
  intent: string; // "career_question" | "general_chat" | "roadmap_question"

  @Prop({ required: true, default: false })
  is_structured: boolean;
}

export const ConversationMessageSchema: MongooseSchema =
  SchemaFactory.createForClass(ConversationMessage);
