import { Exclude, Expose, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { UserDocument, User } from '../user.schema';

export class UserRoleResponseDto {
  @Expose()
  name: string;

  @Expose()
  permissions: string[];

  @Expose()
  isActive: boolean;

  @Expose()
  level: number;
}

export class UserResponseDto {
  static fromDocument(
    createdUser: Document<unknown, {}, UserDocument> &
      User &
      Document<any, any, any> & { _id: Types.ObjectId },
  ): UserResponseDto | PromiseLike<UserResponseDto> {
    throw new Error('Method not implemented.');
  }
  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  @Type(() => UserRoleResponseDto)
  roleId: UserRoleResponseDto;

  @Expose()
  role: string;

  @Expose()
  department: string;

  @Expose()
  managerId: string;

  @Expose()
  status: string;

  @Expose()
  lastLoginAt: Date;

  @Exclude()
  emailVerifiedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Exclude sensitive fields
  @Expose()
  uuid: string;

  @Exclude()
  _id: any;

  @Exclude()
  __v: number;

  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;

  @Exclude()
  resetPasswordToken: string;

  @Exclude()
  resetPasswordExpires: Date;
}
