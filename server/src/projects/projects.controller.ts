import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../roles/enums/permission.enum';
import { TenantContextInterceptor } from '../organizations/tenant-context.interceptor';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequirePermissions(Permission.PROJECT_CREATE)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @RequirePermissions(Permission.PROJECT_LIST)
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('organization/:organizationId')
  @RequirePermissions(Permission.PROJECT_LIST)
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.projectsService.findByOrganization(organizationId);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.PROJECT_READ)
  findOne(@Param('uuid') uuid: string) {
    return this.projectsService.findByUuid(uuid);
  }

  @Put(':uuid')
  @RequirePermissions(Permission.PROJECT_UPDATE)
  update(@Param('uuid') uuid: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(uuid, updateProjectDto);
  }

  @Delete(':uuid')
  @RequirePermissions(Permission.PROJECT_DELETE)
  delete(@Param('uuid') uuid: string) {
    return this.projectsService.delete(uuid);
  }

  @Get(':uuid/users')
  @RequirePermissions(Permission.PROJECT_READ)
  getProjectUsers(@Param('uuid') uuid: string) {
    return this.projectsService.getProjectUsers(uuid);
  }

  @Get(':uuid/available-users')
  @RequirePermissions(Permission.PROJECT_MANAGE_USERS)
  getAvailableUsers(@Param('uuid') uuid: string) {
    return this.projectsService.getAvailableUsers(uuid);
  }
}
