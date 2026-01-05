import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserDepartment } from "../../users/enums/user-department.enum";

export class RegisterDto {
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

    @IsString()
    @IsOptional()
    roleId: string;

    @IsString()
    @IsOptional()
    managerId: string;

    @IsOptional()
    @IsEnum(UserDepartment)
    department?: UserDepartment;

}