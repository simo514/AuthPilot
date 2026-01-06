import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { UserDepartment } from '../enums/user-department.enum';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
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
    @IsEnum(UserDepartment)
    department?: UserDepartment;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}