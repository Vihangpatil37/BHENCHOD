import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SavedCareerDocument = SavedCareer & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'saved_careers',
})
export class SavedCareer {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped UUID

  @Prop({ required: true, index: true })
  career_code: string; // stable career code
}

export const SavedCareerSchema: MongooseSchema =
  SchemaFactory.createForClass(SavedCareer);
