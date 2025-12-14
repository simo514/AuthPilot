import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, IsMongoId } from 'class-validator';
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

    @IsMongoId()
    @IsNotEmpty()
    roleId: string;

    @IsOptional()
    @IsEnum(UserDepartment)
    department?: UserDepartment;
}