import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users',
})
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  user_id: string; // UUID, hyphens stripped

  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email: string;

  @Prop({ required: false, default: false })
  email_verified: boolean;

  @Prop({ required: true, select: false })
  password_hash: string;

  @Prop({ required: true, default: 'local' })
  provider: string; // "local" | etc.

  @Prop({ required: true, default: 'student' })
  role: string; // "student" | "admin"

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, default: 0 })
  failed_login_attempts: number;

  @Prop({ required: false, type: Date })
  locked_until?: Date;

  @Prop({ required: false, type: Date })
  last_login?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
