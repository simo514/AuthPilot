import { IsOptional, IsString, IsEmail, IsEnum, IsMongoId } from 'class-validator';
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
	@IsMongoId()
	roleId?: string;

	@IsOptional()
	@IsEnum(UserDepartment)
	department?: UserDepartment;

	@IsOptional()
	@IsString()
	status?: string;
}
