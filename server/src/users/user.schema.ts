import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'crypto';
import { UserDepartment } from './enums/user-department.enum';
import { UserStatus } from './enums/user-status.enum';


export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    default: () => randomUUID(),
    unique: true,
    index: true,
  })
  uuid: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string;

  @Prop({
    required: true,
    select: false, // Exclude password from queries by default
    minlength: 6,
  })
  password: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  fullName: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Role',
    required: true,
  })
  roleId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  role: string;


  @Prop({
    type: String,
    enum: [...Object.values(UserDepartment), null],
    default: null,
    required: false,
  })
  department: UserDepartment | null;

  @Prop({
    type: String,
    default: null,
    index: true,
    required: false,
  })
  managerId: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true,
  })
  status: UserStatus;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt: Date;

  @Prop({
    type: String,
    default: null,
  })
  refreshToken: string;

  @Prop({
    type: Date,
    default: null,
  })
  emailVerifiedAt: Date;

  @Prop({
    type: String,
    default: null,
  })
  resetPasswordToken: string;

  @Prop({
    type: Date,
    default: null,
  })
  resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for common queries
UserSchema.index({ status: 1, role: 1 }); // Filter active users by role
UserSchema.index({ department: 1, status: 1 }); // Filter users by department
UserSchema.index({ createdAt: -1 }); // Sort by registration date
UserSchema.index({ lastLoginAt: -1 }); // Sort by activity
