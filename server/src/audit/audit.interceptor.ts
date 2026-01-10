import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
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

    // Google OAuth actions
    if (cleanUrl.includes('/auth/google')) {
      if (method === 'GET') return 'Google Login';
      if (method === 'POST') return 'Google OAuth Callback';
    }

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

    // Organization actions
    if (cleanUrl.match(/\/organizations\/[^/]+$/) && method === 'GET') return 'View Organization';
    if (cleanUrl.match(/\/organizations\/[^/]+$/) && method === 'PATCH') return 'Update Organization';
    if (cleanUrl.match(/\/organizations\/[^/]+$/) && method === 'DELETE') return 'Delete Organization';
    if (cleanUrl === '/organizations' && method === 'GET') return 'List Organizations';
    if (cleanUrl === '/organizations' && method === 'POST') return 'Create Organization';

    // Default fallback
    return `${method} ${cleanUrl}`;
  }

  private sanitizeResponse(response: any): any {
    if (!response) return response;

    // Create a copy to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(response));

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'accessToken',
      'refreshToken',
      'token',
      'secret',
      'apiKey',
    ];

    const removeSensitiveData = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key in obj) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          removeSensitiveData(obj[key]);
        }
      }
    };

    removeSensitiveData(sanitized);

    // Limit response size to prevent huge logs (max 5000 chars)
    const responseStr = JSON.stringify(sanitized);
    if (responseStr.length > 5000) {
      return {
        _truncated: true,
        _size: responseStr.length,
        _preview: responseStr.substring(0, 5000) + '...',
      };
    }

    return sanitized;
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

          // Sanitize response to remove sensitive data
          const sanitizedResponse = this.sanitizeResponse(response);

          this.auditService.createAudit(
            actionDescription,
            `${actionDescription} completed successfully`,
            sanitizedResponse,
            ipAddress,
            'success',
            userObject,
            userObject?.organizationId,
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
            userObject,
            userObject?.organizationId,
          );
        },
      }),
    );
  }
}
