import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './organization.schema';
import { Project } from '../projects/project.schema';
import { User } from '../users/user.schema';
import { Task } from '../tasks/task.schema';
import { OrganizationStatus } from './enums/organization-status.enum';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationModel: any;
  let projectModel: any;
  let userModel: any;
  let taskModel: any;

  const mockOrganization = {
    _id: 'org-object-id',
    uuid: 'org-uuid-123',
    name: 'Test Organization',
    slug: 'test-org',
    domain: 'test.example.com',
    status: OrganizationStatus.ACTIVE,
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const mockOrganizationModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockOrganization, ...data, toObject: jest.fn().mockReturnValue({ ...mockOrganization, ...data }) }),
        toObject: jest.fn().mockReturnValue({ ...mockOrganization, ...data }),
      };
    };
    mockOrganizationModel.find = jest.fn();
    mockOrganizationModel.findOne = jest.fn();
    mockOrganizationModel.countDocuments = jest.fn();
    mockOrganizationModel.deleteOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });

    const mockProjectModel = {
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) }),
    };

    const mockUserModel = {
      updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) }),
    };

    const mockTaskModel = {
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getModelToken(Organization.name), useValue: mockOrganizationModel },
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationModel = module.get(getModelToken(Organization.name));
    projectModel = module.get(getModelToken(Project.name));
    userModel = module.get(getModelToken(User.name));
    taskModel = module.get(getModelToken(Task.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'New Organization',
      slug: 'new-org',
      domain: 'new.example.com',
    };

    it('should create an organization successfully', async () => {
      organizationModel.findOne = jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }) // slug check
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }); // domain check

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
    });

    it('should throw ConflictException when slug already exists', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when domain already exists', async () => {
      organizationModel.findOne = jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }) // slug check - not found
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockOrganization) }); // domain check - found

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should allow creation without domain', async () => {
      const dtoWithoutDomain = { name: 'New Org', slug: 'new-org' };
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(dtoWithoutDomain);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated organizations', async () => {
      organizationModel.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockOrganization]),
          }),
        }),
      });
      organizationModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(10),
      });

      const result = await service.findAll(1, 10);

      expect(result.organizations).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should filter by status when provided', async () => {
      organizationModel.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockOrganization]),
          }),
        }),
      });
      organizationModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      await service.findAll(1, 10, OrganizationStatus.ACTIVE);

      expect(organizationModel.find).toHaveBeenCalledWith({ status: OrganizationStatus.ACTIVE });
    });
  });

  describe('findByUuid', () => {
    it('should return organization by uuid', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });

      const result = await service.findByUuid('org-uuid-123');

      expect(organizationModel.findOne).toHaveBeenCalledWith({ uuid: 'org-uuid-123' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByUuid('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return organization by slug', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });

      const result = await service.findBySlug('test-org');

      expect(organizationModel.findOne).toHaveBeenCalledWith({ slug: 'test-org' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDomain', () => {
    it('should return organization by domain', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });

      const result = await service.findByDomain('test.example.com');

      expect(organizationModel.findOne).toHaveBeenCalledWith({ domain: 'test.example.com' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByDomain('notfound.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Organization' };

    it('should update organization successfully', async () => {
      const saveMock = jest.fn().mockResolvedValue(true);
      const orgWithSave = {
        ...mockOrganization,
        save: saveMock,
        toObject: jest.fn().mockReturnValue({ ...mockOrganization, ...updateDto }),
      };
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(orgWithSave),
      });

      const result = await service.update('org-uuid-123', updateDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('not-found', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing slug', async () => {
      const orgWithSave = { ...mockOrganization, save: jest.fn() };
      organizationModel.findOne = jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(orgWithSave) }) // find org
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ slug: 'existing-slug' }) }); // slug check

      await expect(service.update('org-uuid-123', { slug: 'existing-slug' })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when updating to existing domain', async () => {
      const orgWithSave = { ...mockOrganization, domain: 'old-domain.com', save: jest.fn() };
      organizationModel.findOne = jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(orgWithSave) }) // find org
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ domain: 'existing.com' }) }); // domain check - conflict

      await expect(service.update('org-uuid-123', { domain: 'existing.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete organization and cascade delete related data', async () => {
      const orgWithDelete = {
        ...mockOrganization,
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(orgWithDelete),
      });

      await service.delete('org-uuid-123');

      expect(taskModel.deleteMany).toHaveBeenCalled();
      expect(projectModel.deleteMany).toHaveBeenCalled();
      expect(userModel.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
