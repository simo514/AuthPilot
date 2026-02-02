import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './project.schema';
import { Organization } from '../organizations/organization.schema';
import { User } from '../users/user.schema';
import { Task } from '../tasks/task.schema';
import { TenantContextService } from '../organizations/tenant-context.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectModel: any;
  let organizationModel: any;
  let userModel: any;
  let taskModel: any;
  let tenantContext: jest.Mocked<TenantContextService>;

  const mockOrganization = {
    _id: 'org-object-id',
    uuid: 'org-uuid-123',
    name: 'Test Organization',
    slug: 'test-org',
  };

  const mockProject = {
    _id: 'project-object-id',
    uuid: 'project-uuid-123',
    name: 'Test Project',
    slug: 'test-project',
    description: 'Test project description',
    organizationId: mockOrganization._id,
    status: 'active',
    save: jest.fn(),
    populate: jest.fn(),
  };

  const mockUser = {
    _id: 'user-object-id',
    uuid: 'user-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    projectId: mockProject._id,
  };

  beforeEach(async () => {
    const mockProjectModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockProject, ...data }),
      };
    };
    mockProjectModel.find = jest.fn();
    mockProjectModel.findOne = jest.fn();
    mockProjectModel.findByIdAndUpdate = jest.fn();
    mockProjectModel.deleteOne = jest.fn();
    mockProjectModel.countDocuments = jest.fn();

    const mockOrganizationModel = {
      findOne: jest.fn(),
    };

    const mockUserModel = {
      findOne: jest.fn(),
      updateMany: jest.fn(),
    };

    const mockTaskModel = {
      find: jest.fn(),
      deleteMany: jest.fn(),
    };

    const mockTenantContext = {
      getOrganizationId: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: getModelToken(Organization.name), useValue: mockOrganizationModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectModel = module.get(getModelToken(Project.name));
    organizationModel = module.get(getModelToken(Organization.name));
    userModel = module.get(getModelToken(User.name));
    taskModel = module.get(getModelToken(Task.name));
    tenantContext = module.get(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'New Project',
      slug: 'new-project',
      description: 'New project description',
      organizationId: 'org-uuid-123',
    };

    it('should create a project successfully', async () => {
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });
      projectModel.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(organizationModel.findOne).toHaveBeenCalledWith({ uuid: createDto.organizationId });
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when slug already exists', async () => {
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });
      projectModel.findOne = jest.fn().mockResolvedValue(mockProject);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      projectModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockProject]),
        }),
      });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });

    it('should filter by organization from tenant context', async () => {
      tenantContext.getOrganizationId.mockReturnValue('org-uuid-123');
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });
      projectModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockProject]),
        }),
      });

      await service.findAll();

      expect(organizationModel.findOne).toHaveBeenCalledWith({ uuid: 'org-uuid-123' });
    });
  });

  describe('findByOrganization', () => {
    it('should return projects by organization', async () => {
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrganization),
      });
      projectModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockProject]),
        }),
      });

      const result = await service.findByOrganization('org-uuid-123');

      expect(result).toHaveLength(1);
      expect(organizationModel.findOne).toHaveBeenCalledWith({ uuid: 'org-uuid-123' });
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByOrganization('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUserProjects', () => {
    it('should return projects for user with projectId', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      projectModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProject),
        }),
      });

      const result = await service.findUserProjects('user-uuid-123');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findUserProjects('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should get projects from tasks when user has no direct projectId', async () => {
      const userWithoutProject = { ...mockUser, projectId: null };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithoutProject),
      });
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ project: mockProject }]),
        }),
      });

      const result = await service.findUserProjects('user-uuid-123');

      expect(taskModel.find).toHaveBeenCalled();
    });
  });

  describe('findByUuid', () => {
    it('should return project by uuid', async () => {
      projectModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProject),
        }),
      });

      const result = await service.findByUuid('project-uuid-123');

      expect(result).toBeDefined();
      expect(projectModel.findOne).toHaveBeenCalledWith({ uuid: 'project-uuid-123' });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findByUuid('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Project' };

    it('should update project successfully', async () => {
      const projectWithSave = {
        ...mockProject,
        save: jest.fn().mockResolvedValue({ ...mockProject, ...updateDto }),
        populate: jest.fn().mockResolvedValue({ ...mockProject, ...updateDto }),
      };
      projectModel.findOne = jest.fn()
        .mockReturnValueOnce(projectWithSave) // first find
        .mockReturnValueOnce({ // slug check
          exec: jest.fn().mockResolvedValue(null),
        });

      const result = await service.update('project-uuid-123', updateDto);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when project not found', async () => {
      projectModel.findOne = jest.fn().mockReturnValue(null);

      await expect(service.update('not-found', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing slug', async () => {
      const projectWithSave = { ...mockProject, save: jest.fn() };
      projectModel.findOne = jest.fn()
        .mockReturnValueOnce(projectWithSave)
        .mockReturnValueOnce({ uuid: 'other-project' }); // existing project with same slug

      await expect(service.update('project-uuid-123', { slug: 'existing-slug' })).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete project and related data', async () => {
      projectModel.findOne = jest.fn().mockReturnValue(mockProject);
      taskModel.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      });
      userModel.updateMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });
      projectModel.deleteOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.delete('project-uuid-123');

      expect(taskModel.deleteMany).toHaveBeenCalled();
      expect(userModel.updateMany).toHaveBeenCalled();
      expect(projectModel.deleteOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project not found', async () => {
      projectModel.findOne = jest.fn().mockReturnValue(null);

      await expect(service.delete('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
