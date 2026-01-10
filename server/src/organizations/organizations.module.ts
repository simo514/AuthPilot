import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization, OrganizationSchema } from './organization.schema';
import { TenantContextService } from './tenant-context.service';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    AuditModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, TenantContextService, TenantContextInterceptor],
  exports: [OrganizationsService, TenantContextService, TenantContextInterceptor],
})
export class OrganizationsModule {}
