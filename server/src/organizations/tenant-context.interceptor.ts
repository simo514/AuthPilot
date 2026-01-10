import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * TenantContextInterceptor - Automatically sets organization context from JWT
 * Extracts organizationId from the authenticated user and stores it in TenantContextService
 * This ensures all subsequent operations in the request have access to the organization context
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is authenticated and has an organizationId, set it in context
    if (user && user.organizationId) {
      this.tenantContext.setOrganizationId(user.organizationId.toString());
    }

    return next.handle();
  }
}
