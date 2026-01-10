import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Audit, AuditSchema } from './audit.schema';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }]),
    forwardRef(() => OrganizationsModule), // Import to get TenantContextService
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
