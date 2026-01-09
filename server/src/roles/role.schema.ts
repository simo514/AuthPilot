import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Permission } from './enums/permission.enum';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
    default: '',
  })
  description: string;

  @Prop({
    type: [String],
    enum: Object.values(Permission),
    default: [],
  })
  permissions: Permission[];

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  })
  level: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Create index for faster queries on active roles
RoleSchema.index({ isActive: 1, level: -1 });
