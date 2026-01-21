import {
  Body,
  Controller,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
  Param,
  NotFoundException,
  Get,
  Query,
  Delete,
  Logger,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { TenantContextInterceptor } from '../organizations/tenant-context.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../roles/enums/permission.enum';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.USER_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.debug(`Creating user with data: ${JSON.stringify(createUserDto)}`);
    const user = await this.usersService.createUser(createUserDto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Get('/managers')
  @RequirePermissions(Permission.USER_LIST)
  @HttpCode(HttpStatus.OK)
  async getManagers(): Promise<UserResponseDto[]> {
    const managers = await this.usersService.getManagers();
    if (!managers) {
      this.logger.warn('No managers found');
      throw new NotFoundException('No managers found');
    }
    return plainToInstance(UserResponseDto, managers, { excludeExtraneousValues: true });
  }

  // Removed: my-team endpoint - use GET /users instead
  // Tenant context automatically filters by organization

  @Patch('password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetPassword(
    @Request() req,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    const currentUser = req.user;

    if (!currentUser) {
      throw new NotFoundException('User not authenticated');
    }

    this.logger.log(`${currentUser.email}/password - Resetting password`);
    await this.usersService.updatePassword(currentUser.email, currentPassword, newPassword);
    return { message: 'Password updated successfully' };
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.USER_UPDATE)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('uuid') uuid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`PATCH /users/${uuid} - Updating user`);
    const updated = await this.usersService.updateUser(uuid, updateUserDto);
    if (!updated) {
      this.logger.warn(`User not found: ${uuid}`);
      throw new NotFoundException('User not found');
    }
    return plainToInstance(UserResponseDto, updated, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermissions(Permission.USER_LIST)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    this.logger.log(`GET /users - Fetching users with filters`);
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);

    const result = await this.usersService.getAllUsers(pageNum, limitNum, search, role);

    return {
      users: plainToInstance(UserResponseDto, result.users, { excludeExtraneousValues: true }),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get(':uuid')
  @RequirePermissions(Permission.USER_READ)
  async getUserById(@Param('uuid', new ParseUUIDPipe()) uuid: string): Promise<UserResponseDto> {
    this.logger.log(`GET /users/${uuid} - Fetching user`);
    const user = await this.usersService.getUserById(uuid);
    if (!user) {
      this.logger.warn(`User not found: ${uuid}`);
      throw new NotFoundException('User not found');
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.USER_DELETE)
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('uuid') uuid: string, @Request() req): Promise<{ message: string }> {
    const currentUser = req.user;
    if (currentUser?.uuid === uuid) {
      throw new BadRequestException('You cannot delete your own account while connected.');
    }
    const deleted = await this.usersService.deleteUser(uuid);
    if (!deleted) {
      this.logger.warn(`User not found for deletion: ${uuid}`);
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  // Organization-related endpoints
  @Patch(':uuid/organization')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE_USERS)
  @HttpCode(HttpStatus.OK)
  async assignUserToOrganization(
    @Param('uuid') uuid: string,
    @Body('organizationId') organizationId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Assigning user ${uuid} to organization ${organizationId}`);
    await this.usersService.assignUserToOrganization(uuid, organizationId);
    return { message: 'User assigned to organization successfully' };
  }

  @Delete(':uuid/organization')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE_USERS)
  @HttpCode(HttpStatus.OK)
  async removeUserFromOrganization(@Param('uuid') uuid: string): Promise<{ message: string }> {
    this.logger.log(`Removing user ${uuid} from organization`);
    await this.usersService.removeUserFromOrganization(uuid);
    return { message: 'User removed from organization successfully' };
  }

  @Get('organization/:organizationId/users')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  async getUsersByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`GET /users/organization/${organizationId}/users - Fetching users`);
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);

    const result = await this.usersService.getUsersByOrganization(organizationId, pageNum, limitNum);

    return {
      users: plainToInstance(UserResponseDto, result.users, { excludeExtraneousValues: true }),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('unassigned/list')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE_USERS)
  async getUnassignedUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log('GET /users/unassigned/list - Fetching unassigned users');
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);

    const result = await this.usersService.getUnassignedUsers(pageNum, limitNum);

    return {
      users: plainToInstance(UserResponseDto, result.users, { excludeExtraneousValues: true }),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Post(':uuid/project/:projectUuid')
  @RequirePermissions(Permission.PROJECT_MANAGE_USERS)
  async assignUserToProject(
    @Param('uuid') uuid: string,
    @Param('projectUuid') projectUuid: string,
  ) {
    this.logger.log(`POST /users/${uuid}/project/${projectUuid} - Assigning user to project`);
    const user = await this.usersService.assignUserToProject(uuid, projectUuid);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Delete(':uuid/project')
  @RequirePermissions(Permission.PROJECT_MANAGE_USERS)
  async removeUserFromProject(@Param('uuid') uuid: string) {
    this.logger.log(`DELETE /users/${uuid}/project - Removing user from project`);
    const user = await this.usersService.removeUserFromProject(uuid);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
