import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Role, RoleDocument } from './role.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoleDto } from './dto/create-role.dto';
import { Permission } from './enums/permission.enum';

@Injectable()
export class RolesService {
    constructor(
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    ){}

    async createRole(roleData: CreateRoleDto): Promise<Role> {
        const createdRole = new this.roleModel(roleData);
        try {
            return await createdRole.save();
        } catch (err: any) {
            // Check for MongoDB duplicate key error
            if (err.code === 11000 || err.name === 'MongoServerError' && err.message?.includes('duplicate key')) {
                const duplicateName = err?.keyValue?.name || roleData.name;
                throw new ConflictException(`Role with name '${duplicateName}' already exists`);
            }
            // Check for Mongoose validation errors
            if (err.name === 'ValidationError') {
                throw new ConflictException(err.message);
            }
            throw new InternalServerErrorException('Failed to create role');
        }
    }

    async getRoles(): Promise<Role[]> {
        try{
            return this.roleModel.find().exec();
        } catch (err) {
            throw new InternalServerErrorException('Failed to fetch roles');
        }
    }

    async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
        try {
            const updatedRole = await this.roleModel.findByIdAndUpdate(
                roleId,
                { permissions },
                { new: true, runValidators: true },
            ).exec();

            if (!updatedRole) {
                throw new ConflictException('Role not found');
            }

            return updatedRole;
        } catch (err) {
            throw new InternalServerErrorException('Failed to update role permissions');
        }
    }

    async toggleRoleStatus(roleId: string, isActive: boolean): Promise<Role> {
        try {
            const updatedRole = await this.roleModel.findByIdAndUpdate(
                roleId,
                { isActive },
                { new: true },
            ).exec();

            if (!updatedRole) {
                throw new ConflictException('Role not found');
            }

            return updatedRole;
        } catch (err) {
            throw new InternalServerErrorException(`Failed to ${isActive ? 'activate' : 'deactivate'} role`);
        }
    }

    async deleteRole(roleId: string): Promise<void> {
        try {
            const result = await this.roleModel.findByIdAndDelete(roleId).exec();
            if (!result) {
                throw new ConflictException('Role not found');
            }
        } catch (err) {
            throw new InternalServerErrorException('Failed to delete role');
        }
    }

    getAllPermissions(): string[] {
        return Object.values(Permission);
    }
}
