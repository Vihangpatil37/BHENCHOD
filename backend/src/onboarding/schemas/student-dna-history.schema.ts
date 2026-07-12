import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { StudentDNA, StudentDNASchema } from './student-profile.schema';

export type StudentDNAHistoryDocument = StudentDNAHistory & Document;

@Schema({
  timestamps: { createdAt: 'computed_at', updatedAt: false },
  collection: 'student_dna_histories',
})
export class StudentDNAHistory {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped UUID

  @Prop({ type: StudentDNASchema, required: true })
  dna_snapshot: StudentDNA;

  @Prop({ required: true })
  trigger: string; // "onboarding_complete" | "profile_updated" | "manual_recompute"
}

export const StudentDNAHistorySchema: MongooseSchema = SchemaFactory.createForClass(StudentDNAHistory);
