import { Exclude, Expose, Transform } from 'class-transformer';

export class RoleResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id.toString())
    id: string;

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
