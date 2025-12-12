import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { UserRole } from './enums/user-role.enum';
import { UserDepartment } from './enums/user-department.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ default: () => randomUUID(), unique: true })
  uuid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ enum: Object.values(UserRole), default: UserRole.USER }) 
  role: UserRole; 

  @Prop({ 
    type: String,
    enum: [...Object.values(UserDepartment), null], 
    default: null,
    required: false
  })
  department: UserDepartment | null; 

  @Prop({ default: 'active' })
  status: string; 
}

export const UserSchema = SchemaFactory.createForClass(User);
