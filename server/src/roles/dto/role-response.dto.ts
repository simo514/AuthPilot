import { Exclude, Expose } from 'class-transformer';

export class RoleResponseDto {
    @Expose()
    name: string;

    @Expose()
    description: string;

    @Expose()
    permissions: string[];

    @Expose()
    isActive: boolean;

    @Expose()
    level: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Exclude()
    _id: any;

    @Exclude()
    __v: number;
}
