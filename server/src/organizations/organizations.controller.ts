import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../roles/enums/permission.enum';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { OrganizationStatus } from './enums/organization-status.enum';
import { AuditInterceptor } from '../audit/audit.interceptor';
@Controller('organizations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequirePermissions(Permission.ORGANIZATION_CREATE)
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @RequirePermissions(Permission.ORGANIZATION_LIST)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrganizationStatus,
  ): Promise<{ organizations: OrganizationResponseDto[]; total: number }> {
    return this.organizationsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      status,
    );
  }

  @Get('slug/:slug')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  async findBySlug(@Param('slug') slug: string): Promise<OrganizationResponseDto> {
    return this.organizationsService.findBySlug(slug);
  }

  @Get('domain/:domain')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  async findByDomain(@Param('domain') domain: string): Promise<OrganizationResponseDto> {
    return this.organizationsService.findByDomain(domain);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  async findByUuid(@Param('uuid') uuid: string): Promise<OrganizationResponseDto> {
    return this.organizationsService.findByUuid(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  async update(
    @Param('uuid') uuid: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(uuid, updateOrganizationDto);
  }

  @Patch(':uuid/status')
  @RequirePermissions(Permission.ORGANIZATION_UPDATE)
  async updateStatus(
    @Param('uuid') uuid: string,
    @Body('status') status: OrganizationStatus,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.updateStatus(uuid, status);
  }

  @Delete(':uuid')
  @UseInterceptors(AuditInterceptor)
  @RequirePermissions(Permission.ORGANIZATION_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('uuid') uuid: string): Promise<void> {
    return this.organizationsService.delete(uuid);
  }
}
