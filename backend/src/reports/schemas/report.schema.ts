import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({
  timestamps: { createdAt: 'generated_at', updatedAt: 'updated_at' },
  collection: 'reports',
})
export class Report {
  @Prop({ required: true, index: true })
  user_id: string; // hyphen-stripped student UUID

  @Prop({ required: true, index: true })
  recommendation_ref: string; // Reference to Recommendation._id

  @Prop({
    required: true,
    enum: ['QUEUED', 'GENERATING', 'READY', 'DOWNLOADED', 'FAILED'],
    default: 'QUEUED',
  })
  status: string;

  @Prop({ required: false })
  file_ref?: string; // local file path to generated PDF
}

export const ReportSchema: MongooseSchema = SchemaFactory.createForClass(Report);
