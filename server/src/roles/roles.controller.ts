import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './role.schema';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
        return this.rolesService.createRole(createRoleDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async getRoles(): Promise<Role[]> {
        return this.rolesService.getRoles();
    }

    @Patch(':roleId/permissions')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateRolePermissions(
        @Param('roleId') roleId: string,
        @Body('permissions') permissions: string[],
    ): Promise<Role> {
        return this.rolesService.updateRolePermissions(roleId, permissions);
    }

    @Patch(':roleId/toggle-status')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async toggleRoleStatus(
        @Param('roleId') roleId: string,
        @Body('isActive') isActive: boolean,
    ): Promise<Role> {
        return this.rolesService.toggleRoleStatus(roleId, isActive);
    }

    @Delete(':roleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteRole(@Param('roleId') roleId: string): Promise<void> {
        return this.rolesService.deleteRole(roleId);
    }   
}
