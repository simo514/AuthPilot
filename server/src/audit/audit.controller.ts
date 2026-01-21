import { Controller, Get, HttpCode, HttpStatus, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResponseDto } from './dto/audit-response.dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { TenantContextInterceptor } from '../organizations/tenant-context.interceptor';

@Controller('audits')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantContextInterceptor)
export class AuditController {
  constructor(
    private auditService: AuditService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllAudits(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);

    // Tenant context automatically filters by organization
    // Admins (no org) see all, managers see only their org
    const result = await this.auditService.getAllAudits(pageNum, limitNum, search);

    return {
      audits: plainToInstance(AuditResponseDto, result.audits, { excludeExtraneousValues: true }),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }
}
