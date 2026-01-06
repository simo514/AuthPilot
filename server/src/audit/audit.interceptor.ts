import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  private getActionDescription(method: string, url: string): string {
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Auth actions
    if (cleanUrl.includes('/auth/login')) return 'Login';
    if (cleanUrl.includes('/auth/register')) return 'Registration';
    
    // User actions
    if (cleanUrl.match(/\/users\/[^/]+$/) && method === 'PATCH') return 'Update User';
    if (cleanUrl.match(/\/users\/[^/]+$/) && method === 'DELETE') return 'Delete User';
    if (cleanUrl === '/users' && method === 'POST') return 'Create User';
    
    // Role actions
    if (cleanUrl.match(/\/roles\/[^/]+$/) && method === 'GET') return 'View Role';
    if (cleanUrl.match(/\/roles\/[^/]+$/) && method === 'PATCH') return 'Update Role';
    if (cleanUrl.match(/\/roles\/[^/]+$/) && method === 'DELETE') return 'Delete Role';
    if (cleanUrl === '/roles' && method === 'GET') return 'List Roles';
    if (cleanUrl === '/roles' && method === 'POST') return 'Create Role';
    
    // Audit actions
    if (cleanUrl.includes('/audit')) return 'View Audit Logs';
    
    // Default fallback
    return `${method} ${cleanUrl}`;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const ipAddress = 
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
      request.headers['x-real-ip'] || 
      request.ip || 
      request.connection?.remoteAddress;
    const method = request.method;
    const url = request.originalUrl || request.url;

    const actionDescription = this.getActionDescription(method, url);

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Try to get user from request (for protected routes) or response (for login/register)
          const user = request.user || response?.user || null;
          
          // Convert user object to plain object ensuring all fields are included
          let userObject = undefined;
          if (user) {
            if (user.toObject) {
              // If it's a Mongoose document, use toObject()
              userObject = user.toObject();
            } else {
              // Otherwise use JSON serialization
              userObject = JSON.parse(JSON.stringify(user));
            }
          }
          
          this.auditService.createAudit(
            actionDescription,
            `${actionDescription} completed successfully`,
            response,
            ipAddress,
            'success',
            userObject
          );
        },
        error: (error) => {
          const user = request.user || null;
          
          // Convert user object to plain object ensuring all fields are included
          let userObject = undefined;
          if (user) {
            if (user.toObject) {
              // If it's a Mongoose document, use toObject()
              userObject = user.toObject();
            } else {
              // Otherwise use JSON serialization
              userObject = JSON.parse(JSON.stringify(user));
            }
          }
          
          this.auditService.createAudit(
            actionDescription,
            `${actionDescription} failed: ${error.message}`,
            { error: error.message },
            ipAddress,
            'failed',
            userObject
          );
        },
      })
    );
  }
}
