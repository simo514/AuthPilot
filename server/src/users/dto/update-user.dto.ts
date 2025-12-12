import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';
import { UserDepartment } from '../enums/user-department.enum';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	fullName?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsEnum(UserDepartment)
	department?: UserDepartment;

	@IsOptional()
	@Transform(({ value }) => value?.toLowerCase())
	@IsEnum(UserRole)
	role?: UserRole;

	@IsOptional()
	@IsString()
	status?: string;
}
