import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';
import { UserDepartment } from '../enums/user-department.enum';

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
    @Transform(({ value }) => value?.toLowerCase())
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(UserDepartment)
    department?: UserDepartment;
}