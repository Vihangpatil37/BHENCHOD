import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { encrypt, decrypt } from '../../common/utils/crypto.util';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users',
  toJSON: { getters: true },
  toObject: { getters: true },
})
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  user_id: string; // UUID, hyphens stripped

  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email: string;

  @Prop({ required: true, default: false })
  is_two_factor_enabled: boolean;

  @Prop({ required: false, select: false })
  password_hash: string;



  @Prop({ required: true, default: 'local' })
  provider: string; // "local" | etc.

  @Prop({ required: true, default: 'student' })
  role: string; // "student" | "admin"

  @Prop({ required: true, get: decrypt, set: encrypt })
  full_name: string;

  @Prop({ required: true, default: 0 })
  failed_login_attempts: number;

  @Prop({ required: false, type: Date })
  locked_until?: Date;

  @Prop({ required: false, type: Date })
  last_login?: Date;

  @Prop({ required: false, select: false, get: decrypt, set: encrypt })
  two_factor_secret?: string;

  @Prop({ required: false, select: false, type: [String] })
  recovery_codes?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
