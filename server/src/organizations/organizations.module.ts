import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization, OrganizationSchema } from './organization.schema';
import { TenantContextService } from './tenant-context.service';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { AuditModule } from '../audit/audit.module';
import { Project, ProjectSchema } from '../projects/project.schema';
import { User, UserSchema } from '../users/user.schema';
import { Task, TaskSchema } from '../tasks/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    forwardRef(() => AuditModule),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, TenantContextService, TenantContextInterceptor],
  exports: [OrganizationsService, TenantContextService, TenantContextInterceptor],
})
export class OrganizationsModule {}
