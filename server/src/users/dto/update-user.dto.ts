import { IsOptional, IsString, IsEmail, IsEnum, IsMongoId } from 'class-validator';
import { UserDepartment } from '../enums/user-department.enum';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	fullName?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsMongoId()
	roleId?: string;

	@IsOptional()
	@IsEnum(UserDepartment)
	department?: UserDepartment;

	@IsOptional()
	@IsString()
	managerId?: string;	

	@IsOptional()
	@IsEnum(UserStatus)
	status?: UserStatus;
}
