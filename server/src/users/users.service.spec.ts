import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { Role } from '../roles/role.schema';
import { Organization } from '../organizations/organization.schema';
import { Project } from '../projects/project.schema';
import { Task } from '../tasks/task.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { OrganizationsService } from '../organizations/organizations.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let roleModel: any;
  let organizationModel: any;
  let projectModel: any;
  let taskModel: any;
  let tenantContext: jest.Mocked<TenantContextService>;
  let organizationsService: jest.Mocked<OrganizationsService>;

  const mockUser = {
    _id: 'user-object-id',
    uuid: 'test-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedPassword',
    role: 'user',
    roleId: 'role-object-id',
    status: 'active',
    save: jest.fn(),
    toObject: jest.fn().mockReturnThis(),
  };

  const mockRole = {
    _id: 'role-object-id',
    name: 'user',
    permissions: ['read'],
    isActive: true,
  };

  beforeEach(async () => {
    const mockUserModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockUser, ...data }),
      };
    };
    mockUserModel.find = jest.fn();
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.findOneAndUpdate = jest.fn();
    mockUserModel.countDocuments = jest.fn();
    mockUserModel.updateMany = jest.fn();
    mockUserModel.deleteOne = jest.fn();

    const mockRoleModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockOrganizationModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockProjectModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockTaskModel = {
      find: jest.fn(),
    };

    const mockTenantContext = {
      getOrganizationId: jest.fn().mockReturnValue(null),
    };

    const mockOrganizationsService = {
      findByUuid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        { provide: getModelToken(Organization.name), useValue: mockOrganizationModel },
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
        { provide: TenantContextService, useValue: mockTenantContext },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    roleModel = module.get(getModelToken(Role.name));
    organizationModel = module.get(getModelToken(Organization.name));
    projectModel = module.get(getModelToken(Project.name));
    taskModel = module.get(getModelToken(Task.name));
    tenantContext = module.get(TenantContextService);
    organizationsService = module.get(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto = {
      fullName: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
    };

    it('should create a user with default role when no roleId provided', async () => {
      roleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });
      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.createUser(createUserDto);

      expect(roleModel.findOne).toHaveBeenCalledWith({ name: /^user$/i });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toBeDefined();
    });

    it('should throw InternalServerErrorException when default role not found', async () => {
      roleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw BadRequestException when invalid roleId provided', async () => {
      const dtoWithRoleId = { ...createUserDto, roleId: 'invalid-role-id' };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.createUser(dtoWithRoleId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when inactive role is provided', async () => {
      const dtoWithRoleId = { ...createUserDto, roleId: 'inactive-role-id' };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockRole, isActive: false }),
      });

      await expect(service.createUser(dtoWithRoleId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUser', () => {
    const uuid = 'test-uuid-123';
    const updateData = { fullName: 'Updated Name' };

    it('should update user successfully', async () => {
      userModel.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ ...mockUser, ...updateData }),
            }),
          }),
        }),
      });

      const result = await service.updateUser(uuid, updateData);

      expect(userModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.fullName).toBe('Updated Name');
    });

    it('should return null when user not found', async () => {
      userModel.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      const result = await service.updateUser(uuid, updateData);

      expect(result).toBeNull();
    });

    it('should strip password from update data', async () => {
      const updateWithPassword = { ...updateData, password: 'newPassword' };
      userModel.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUser),
            }),
          }),
        }),
      });

      await service.updateUser(uuid, updateWithPassword);

      // The password should not be in the update call
      const updateCall = userModel.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1]).not.toHaveProperty('password');
    });

    it('should validate roleId when provided', async () => {
      const updateWithRole = { ...updateData, roleId: 'new-role-id' };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });
      userModel.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUser),
            }),
          }),
        }),
      });

      await service.updateUser(uuid, updateWithRole);

      expect(roleModel.findById).toHaveBeenCalledWith('new-role-id');
    });

    it('should throw BadRequestException for invalid roleId', async () => {
      const updateWithRole = { ...updateData, roleId: 'invalid-role-id' };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateUser(uuid, updateWithRole)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      userModel.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockRejectedValue({ code: 11000 }),
            }),
          }),
        }),
      });

      await expect(service.updateUser(uuid, { email: 'existing@example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      userModel.countDocuments.mockResolvedValue(10);
      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockUser]),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getAllUsers(1, 10);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
    });

    it('should apply search filter', async () => {
      userModel.countDocuments.mockResolvedValue(1);
      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockUser]),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      await service.getAllUsers(1, 10, 'test');

      const findCall = userModel.find.mock.calls[0][0];
      expect(findCall.$or).toBeDefined();
    });

    it('should apply role filter', async () => {
      userModel.countDocuments.mockResolvedValue(1);
      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockUser]),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      await service.getAllUsers(1, 10, undefined, 'admin');

      const findCall = userModel.find.mock.calls[0][0];
      expect(findCall.role).toBe('admin');
    });

    it('should apply organization filter from tenant context', async () => {
      tenantContext.getOrganizationId.mockReturnValue('org-uuid-123');
      userModel.countDocuments.mockResolvedValue(1);
      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockUser]),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      await service.getAllUsers(1, 10);

      const findCall = userModel.find.mock.calls[0][0];
      expect(findCall.organizationId).toBe('org-uuid-123');
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePasswords('password123', 'hashedPassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePasswords('wrongPassword', 'hashedPassword');

      expect(result).toBe(false);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user with password', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findByEmailWithPassword('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBeDefined();
    });

    it('should return null when user not found', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findByEmailWithPassword('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user by uuid', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUser),
            }),
          }),
        }),
      });

      const result = await service.getUserById('test-uuid-123');

      expect(userModel.findOne).toHaveBeenCalledWith({ uuid: 'test-uuid-123' });
      expect(result).toBeDefined();
    });

    it('should return null when user not found', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      const result = await service.getUserById('not-found-uuid');

      expect(result).toBeNull();
    });
  });
});
