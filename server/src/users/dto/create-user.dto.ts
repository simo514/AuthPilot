import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
