import { Injectable, Scope } from '@nestjs/common';

/**
 * TenantContextService - Stores current organization context per request
 * This is a request-scoped service that maintains the current tenant/organization
 * information throughout the request lifecycle.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private organizationId: string | null = null;

  setOrganizationId(organizationId: string | null): void {
    this.organizationId = organizationId;
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  hasOrganization(): boolean {
    return this.organizationId !== null && this.organizationId !== undefined;
  }

  clear(): void {
    this.organizationId = null;
  }
}
