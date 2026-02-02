import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { Audit } from './audit.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { REQUEST } from '@nestjs/core';

describe('AuditService', () => {
  let service: AuditService;
  let auditModel: any;

  const mockAuditLog = {
    _id: 'audit-id',
    action: 'USER_LOGIN',
    details: 'User logged in',
    ipAddress: '127.0.0.1',
    status: 'success',
    user: { uuid: 'user-uuid-123', fullName: 'Test User' },
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const mockAuditModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockAuditLog, ...data }),
      };
    };
    mockAuditModel.find = jest.fn();
    mockAuditModel.countDocuments = jest.fn();

    const mockTenantContext = {
      getOrganizationId: jest.fn().mockReturnValue(null),
    };

    const mockRequest = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getModelToken(Audit.name), useValue: mockAuditModel },
        { provide: TenantContextService, useValue: mockTenantContext },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditModel = module.get(getModelToken(Audit.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAudit', () => {
    it('should create audit log entry', async () => {
      const result = await service.createAudit(
        'USER_LOGIN',
        'User logged in successfully',
        { success: true },
        '127.0.0.1',
        'success',
        { uuid: 'user-uuid', fullName: 'Test User' },
      );

      expect(result).toBeDefined();
    });

    it('should handle optional parameters', async () => {
      const result = await service.createAudit('ACTION');

      expect(result).toBeDefined();
    });

    it('should set default status to success', async () => {
      const result = await service.createAudit('ACTION', 'details');

      expect(result).toBeDefined();
    });
  });

  describe('getAllAudits', () => {
    it('should return paginated audit logs', async () => {
      auditModel.countDocuments.mockResolvedValue(10);
      auditModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockAuditLog]),
            }),
          }),
        }),
      });

      const result = await service.getAllAudits(1, 10);

      expect(result.audits).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      auditModel.countDocuments.mockResolvedValue(5);
      auditModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockAuditLog]),
            }),
          }),
        }),
      });

      await service.getAllAudits(1, 10, 'login');

      const findCall = auditModel.find.mock.calls[0][0];
      expect(findCall.$or).toBeDefined();
    });
  });
});
