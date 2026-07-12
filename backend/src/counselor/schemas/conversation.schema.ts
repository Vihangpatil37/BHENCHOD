import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({
  timestamps: { createdAt: 'started_at', updatedAt: 'last_message_at' },
  collection: 'conversations',
})
export class Conversation {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped student UUID

  @Prop({ required: false, default: '' })
  summary: string; // rolling summary for long chats
}

export const ConversationSchema: MongooseSchema = SchemaFactory.createForClass(Conversation);
