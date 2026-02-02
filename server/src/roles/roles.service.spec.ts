import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './role.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { Permission } from './enums/permission.enum';

describe('RolesService', () => {
  let service: RolesService;
  let roleModel: any;
  let tenantContext: jest.Mocked<TenantContextService>;

  const mockRole = {
    _id: 'role-object-id',
    name: 'admin',
    permissions: [Permission.USER_READ, Permission.USER_UPDATE],
    isActive: true,
    level: 1,
    save: jest.fn(),
  };

  beforeEach(async () => {
    const mockRoleModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockRole, ...data }),
      };
    };
    mockRoleModel.find = jest.fn();
    mockRoleModel.findById = jest.fn();
    mockRoleModel.findByIdAndUpdate = jest.fn();
    mockRoleModel.findByIdAndDelete = jest.fn();

    const mockTenantContext = {
      getOrganizationId: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleModel = module.get(getModelToken(Role.name));
    tenantContext = module.get(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    const createDto = {
      name: 'manager',
      permissions: [Permission.USER_READ, Permission.USER_UPDATE],
      level: 2,
    };

    it('should create a role successfully', async () => {
      const result = await service.createRole(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const mockRoleModelWithError = function (data: any) {
        return {
          ...data,
          save: jest.fn().mockRejectedValue({ code: 11000, keyValue: { name: 'manager' } }),
        };
      };
      mockRoleModelWithError.find = jest.fn();
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesService,
          { provide: getModelToken(Role.name), useValue: mockRoleModelWithError },
          { provide: TenantContextService, useValue: { getOrganizationId: jest.fn() } },
        ],
      }).compile();

      const serviceWithError = module.get<RolesService>(RolesService);

      await expect(serviceWithError.createRole(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on validation error', async () => {
      const mockRoleModelWithError = function (data: any) {
        return {
          ...data,
          save: jest.fn().mockRejectedValue({ name: 'ValidationError', message: 'Validation failed' }),
        };
      };
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesService,
          { provide: getModelToken(Role.name), useValue: mockRoleModelWithError },
          { provide: TenantContextService, useValue: { getOrganizationId: jest.fn() } },
        ],
      }).compile();

      const serviceWithError = module.get<RolesService>(RolesService);

      await expect(serviceWithError.createRole(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const mockRoleModelWithError = function (data: any) {
        return {
          ...data,
          save: jest.fn().mockRejectedValue(new Error('Database error')),
        };
      };
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RolesService,
          { provide: getModelToken(Role.name), useValue: mockRoleModelWithError },
          { provide: TenantContextService, useValue: { getOrganizationId: jest.fn() } },
        ],
      }).compile();

      const serviceWithError = module.get<RolesService>(RolesService);

      await expect(serviceWithError.createRole(createDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getRoles', () => {
    it('should return all roles', async () => {
      roleModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRole]),
      });

      const result = await service.getRoles();

      expect(result).toHaveLength(1);
      expect(roleModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by organization from tenant context', async () => {
      tenantContext.getOrganizationId.mockReturnValue('org-uuid-123');
      roleModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRole]),
      });

      await service.getRoles();

      expect(roleModel.find).toHaveBeenCalledWith({ organizationId: 'org-uuid-123' });
    });

    it('should throw InternalServerErrorException on error', async () => {
      roleModel.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getRoles()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateRolePermissions', () => {
    const roleId = 'role-object-id';
    const permissions = [Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE];

    it('should update role permissions successfully', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockRole, permissions }),
      });

      const result = await service.updateRolePermissions(roleId, permissions);

      expect(result.permissions).toEqual(permissions);
      expect(roleModel.findByIdAndUpdate).toHaveBeenCalledWith(roleId, { permissions }, { new: true, runValidators: true });
    });

    it('should throw InternalServerErrorException when role not found', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateRolePermissions(roleId, permissions)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.updateRolePermissions(roleId, permissions)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('toggleRoleStatus', () => {
    const roleId = 'role-object-id';

    it('should activate role successfully', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockRole, isActive: true }),
      });

      const result = await service.toggleRoleStatus(roleId, true);

      expect(result.isActive).toBe(true);
      expect(roleModel.findByIdAndUpdate).toHaveBeenCalledWith(roleId, { isActive: true }, { new: true });
    });

    it('should deactivate role successfully', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockRole, isActive: false }),
      });

      const result = await service.toggleRoleStatus(roleId, false);

      expect(result.isActive).toBe(false);
    });

    it('should throw InternalServerErrorException when role not found', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.toggleRoleStatus(roleId, true)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteRole', () => {
    const roleId = 'role-object-id';

    it('should delete role successfully', async () => {
      roleModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });

      await service.deleteRole(roleId);

      expect(roleModel.findByIdAndDelete).toHaveBeenCalledWith(roleId);
    });

    it('should throw InternalServerErrorException when role not found', async () => {
      roleModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deleteRole(roleId)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      roleModel.findByIdAndDelete = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.deleteRole(roleId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all available permissions', () => {
      const result = service.getAllPermissions();

      expect(result).toEqual(Object.values(Permission));
    });
  });

  describe('updateRole', () => {
    const roleId = 'role-object-id';
    const updateData = { name: 'Updated Role', level: 3 };

    it('should update role successfully', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockRole, ...updateData }),
      });

      const result = await service.updateRole(roleId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(roleModel.findByIdAndUpdate).toHaveBeenCalledWith(roleId, updateData, { new: true, runValidators: true });
    });

    it('should throw InternalServerErrorException when role not found', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateRole(roleId, updateData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw ConflictException on duplicate name', async () => {
      roleModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue({ code: 11000, keyValue: { name: 'duplicate' } }),
      });

      await expect(service.updateRole(roleId, { name: 'duplicate' })).rejects.toThrow(ConflictException);
    });
  });
});
