import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { plainToInstance } from 'class-transformer';
import { TenantContextInterceptor } from '../organizations/tenant-context.interceptor';
import { Permission } from './enums/permission.enum';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(Permission.ROLE_CREATE)
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesService.createRole(createRoleDto);
    return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermissions(Permission.ROLE_LIST)
  @HttpCode(HttpStatus.OK)
  async getRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.rolesService.getRoles();
    return plainToInstance(RoleResponseDto, roles, { excludeExtraneousValues: true });
  }

  @Patch(':roleId/permissions')
  @RequirePermissions(Permission.ROLE_UPDATE)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body('permissions') permissions: string[],
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.updateRolePermissions(roleId, permissions);
    return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
  }

  @Patch(':roleId')
  @RequirePermissions(Permission.ROLE_UPDATE)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() updateData: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.updateRole(roleId, updateData);
    return plainToInstance(RoleResponseDto, role, { excludeExtraneousValues: true });
  }

  @Patch(':roleId/toggle-status')
  @RequirePermissions(Permission.ROLE_UPDATE)
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
  @RequirePermissions(Permission.ROLE_DELETE)
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('roleId') roleId: string): Promise<void> {
    return this.rolesService.deleteRole(roleId);
  }

  @Get('permissions')
  @RequirePermissions(Permission.ROLE_READ)
  @HttpCode(HttpStatus.OK)
  async getAllPermissions(): Promise<string[]> {
    return this.rolesService.getAllPermissions();
  }
}
