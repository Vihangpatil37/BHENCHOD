import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CareerDocument = Career & Document;

@Schema({ _id: false })
export class CareerTraitProfile {
  @Prop({ required: true, default: 0, min: 0, max: 100 })
  analytical_thinking: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  creativity: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  communication: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  leadership: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  research: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  business_acumen: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  technical_curiosity: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  empathy: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  patience: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  risk_tolerance: number;
}

export const CareerTraitProfileSchema =
  SchemaFactory.createForClass(CareerTraitProfile);

@Schema({ _id: false })
export class CareerConstraints {
  @Prop({ required: true, default: 0, min: 0, max: 100 })
  min_maths: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  min_science: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  min_biology: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  min_english: number;

  @Prop({ required: true, default: 4, min: 1, max: 4 })
  max_budget_tier: number; // 1 to 4

  @Prop({ required: true, default: 3, min: 0 })
  min_study_duration_years: number;

  @Prop({ required: true, default: 5, min: 0 })
  max_study_duration_years: number;

  @Prop({ required: false, default: 'any' })
  required_stream?: string; // 'PCM' | 'PCB' | 'PCMB' | 'Commerce' | 'Arts' | 'any' | null

  @Prop({ required: true, default: false })
  abroad_required: boolean;
}

export const CareerConstraintsSchema =
  SchemaFactory.createForClass(CareerConstraints);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'careers',
})
export class Career {
  @Prop({ required: true, unique: true, index: true })
  career_code: string; // stable string id, e.g. "software_engineer"

  @Prop({ required: true, index: true })
  category_code: string; // e.g. "technology"

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true, default: [] })
  required_skills: string[];

  @Prop({ type: [String], required: true, default: [] })
  technical_skills: string[];

  @Prop({ type: [String], required: true, default: [] })
  soft_skills: string[];

  @Prop({ required: true, default: 'Medium' })
  market_demand: string; // 'Low' | 'Medium' | 'High'

  @Prop({ required: true, default: 'Stable' })
  future_scope: string; // 'Shrinking' | 'Stable' | 'Growing'

  @Prop({ required: true, default: 'Standard progression' })
  career_progression: string;

  // Active Live Configs
  @Prop({ type: CareerTraitProfileSchema, required: false })
  trait_weights?: CareerTraitProfile;

  @Prop({ type: CareerConstraintsSchema, required: false })
  eligibility?: CareerConstraints;

  // Draft Configs for review/promote
  @Prop({ type: CareerTraitProfileSchema, required: false })
  trait_weights_draft?: CareerTraitProfile;

  @Prop({ type: CareerConstraintsSchema, required: false })
  eligibility_draft?: CareerConstraints;

  // === IMPORT-RELATED FIELDS (added in Phase 0) ===

  @Prop({ required: false, index: true })
  sub_domain_code?: string; // e.g. "science_pcm", "diploma_computer_engineering"

  @Prop({ type: [String], required: false, default: [] })
  pathway_tags?: string[]; // breadcrumb context from source tree, e.g. ["B.Tech CSE"]

  @Prop({ type: [String], required: false, default: [] })
  source_catalog_parts?: string[]; // e.g. ["part_1_science", "part_4_diploma"]

  @Prop({
    required: false,
    default: 'rule_based',
    enum: ['rule_based', 'ai_refined', 'published'],
  })
  backfill_status?: string;

  @Prop({ required: false, default: false })
  needs_enrichment?: boolean; // true if leaf was a broad degree name, not a specific job title

  @Prop({ required: false, default: true })
  is_active?: boolean; // admin can soft-disable without deleting

  @Prop({ required: false })
  imported_at?: Date;
}

export const CareerSchema: MongooseSchema =
  SchemaFactory.createForClass(Career);
