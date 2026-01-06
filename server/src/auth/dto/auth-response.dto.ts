import { Exclude, Expose, Type } from 'class-transformer';

export class RoleResponseDto {
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
    @Expose()
    uuid: string;

    @Expose()
    email: string;

    @Expose()
    fullName: string;

    @Expose()
    @Type(() => RoleResponseDto)
    roleId: RoleResponseDto;

    @Expose()
    role: string;

    @Expose()
    department: string;

    @Expose()
    status: string;

    @Expose()
    managerId: string;


    @Expose()
    lastLoginAt: Date;

    @Expose()
    emailVerifiedAt: Date | null;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    // Exclude sensitive fields
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

export class LoginResponseDto {
    @Expose()
    accessToken: string;

    @Expose()
    refreshToken: string;

    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;
}

export class RefreshResponseDto {
    @Expose()
    accessToken: string;

    @Expose()
    refreshToken: string;
}
