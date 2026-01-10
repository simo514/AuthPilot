import { Expose } from 'class-transformer';

export class AuditResponseDto {
  @Expose()
  uuid: string;

  @Expose()
  organizationId?: string | null;

  @Expose()
  user?: Record<string, any>;

  @Expose()
  action: string;

  @Expose()
  status?: 'success' | 'failed';

  @Expose()
  details?: string;

  @Expose()
  response?: Record<string, any>;

  @Expose()
  ipAddress?: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}
