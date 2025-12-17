import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from './enums/permission.enum';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createRole(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
        const role = await this.rolesService.createRole(createRoleDto);
        return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async getRoles(): Promise<RoleResponseDto[]> {
        const roles = await this.rolesService.getRoles();
        return plainToInstance(RoleResponseDto, roles, { excludeExtraneousValues: true });
    }

    @Patch(':roleId/permissions')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateRolePermissions(
        @Param('roleId') roleId: string,
        @Body('permissions') permissions: string[],
    ): Promise<RoleResponseDto> {
        const role = await this.rolesService.updateRolePermissions(roleId, permissions);
        return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
    }

    @Patch(':roleId/toggle-status')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async toggleRoleStatus(
        @Param('roleId') roleId: string,
        @Body('isActive') isActive: boolean,
    ): Promise<RoleResponseDto> {
        const role = await this.rolesService.toggleRoleStatus(roleId, isActive);
        return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
    }

    @Delete(':roleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteRole(@Param('roleId') roleId: string): Promise<void> {
        return this.rolesService.deleteRole(roleId);
    }   

    @Get('permissions')
    @HttpCode(HttpStatus.OK)
    async getAllPermissions(): Promise<string[]> {
        return this.rolesService.getAllPermissions();
    }


}
