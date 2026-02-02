import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksService } from './tasks.service';
import { Task } from './task.schema';
import { Project } from '../projects/project.schema';
import { User } from '../users/user.schema';
import { Organization } from '../organizations/organization.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: any;
  let projectModel: any;
  let userModel: any;
  let organizationModel: any;
  let tenantContext: jest.Mocked<TenantContextService>;

  const mockOrganization = {
    _id: new Types.ObjectId(),
    uuid: 'org-uuid-123',
    name: 'Test Organization',
  };

  const mockProject = {
    _id: new Types.ObjectId(),
    uuid: 'project-uuid-123',
    name: 'Test Project',
    organizationId: mockOrganization._id,
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    uuid: 'user-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'manager',
    projectId: mockProject._id,
  };

  const mockTask = {
    _id: new Types.ObjectId(),
    title: 'Test Task',
    description: 'Test task description',
    project: mockProject._id,
    organization: mockOrganization._id,
    createdBy: mockUser._id,
    assignedTo: null,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    save: jest.fn(),
    populate: jest.fn(),
  };

  beforeEach(async () => {
    const mockTaskModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockTask, ...data }),
      };
    };
    mockTaskModel.find = jest.fn();
    mockTaskModel.findById = jest.fn();
    mockTaskModel.deleteOne = jest.fn();

    const mockProjectModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockUserModel = {
      findOne: jest.fn(),
    };

    const mockOrganizationModel = {
      findOne: jest.fn(),
    };

    const mockTenantContext = {
      getOrganizationId: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Organization.name), useValue: mockOrganizationModel },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskModel = module.get(getModelToken(Task.name));
    projectModel = module.get(getModelToken(Project.name));
    userModel = module.get(getModelToken(User.name));
    organizationModel = module.get(getModelToken(Organization.name));
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
      title: 'New Task',
      description: 'New task description',
      project: 'project-uuid-123',
      priority: TaskPriority.HIGH,
    };

    it('should create a task successfully', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      projectModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProject),
        }),
      });

      const result = await service.create(createDto, mockUser.uuid);

      expect(result).toBeDefined();
      expect(userModel.findOne).toHaveBeenCalledWith({ uuid: mockUser.uuid });
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.create(createDto, 'not-found')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a manager', async () => {
      const nonManagerUser = { ...mockUser, role: 'user' };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(nonManagerUser),
      });

      await expect(service.create(createDto, mockUser.uuid)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when project not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      projectModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.create(createDto, mockUser.uuid)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when assigned user not found', async () => {
      const dtoWithAssignee = { ...createDto, assignedTo: 'assignee-uuid' };
      userModel.findOne
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      projectModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProject),
        }),
      });

      await expect(service.create(dtoWithAssignee, mockUser.uuid)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when assigned user is not in project', async () => {
      const dtoWithAssignee = { ...createDto, assignedTo: 'assignee-uuid' };
      const assigneeNotInProject = { ...mockUser, _id: new Types.ObjectId(), projectId: new Types.ObjectId() };
      userModel.findOne
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(assigneeNotInProject) });
      projectModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProject),
        }),
      });

      await expect(service.create(dtoWithAssignee, mockUser.uuid)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockTask]),
            }),
          }),
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
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockTask]),
            }),
          }),
        }),
      });

      await service.findAll();

      expect(organizationModel.findOne).toHaveBeenCalledWith({ uuid: 'org-uuid-123' });
    });
  });

  describe('findByProject', () => {
    it('should return tasks by project', async () => {
      projectModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockTask]),
          }),
        }),
      });

      const result = await service.findByProject('project-uuid-123');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByProject('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return task by id', async () => {
      const taskId = new Types.ObjectId().toString();
      taskModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockTask),
            }),
          }),
        }),
      });

      const result = await service.findOne(taskId);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for invalid task id', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = new Types.ObjectId().toString();
      taskModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      await expect(service.findOne(taskId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const taskId = new Types.ObjectId().toString();
    const updateDto = { title: 'Updated Task' };

    it('should update task successfully', async () => {
      const taskWithSave = {
        ...mockTask,
        _id: new Types.ObjectId(taskId),
        save: jest.fn().mockResolvedValue({ ...mockTask, ...updateDto }),
        populate: jest.fn().mockReturnThis(),
      };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(taskWithSave),
      });

      const result = await service.update(taskId, updateDto, mockUser.uuid);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for invalid task id', async () => {
      await expect(service.update('invalid-id', updateDto, mockUser.uuid)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(taskId, updateDto, 'not-found')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when task not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(taskId, updateDto, mockUser.uuid)).rejects.toThrow(NotFoundException);
    });

    it('should set completedAt when status changes to completed', async () => {
      const taskWithSave = {
        ...mockTask,
        _id: new Types.ObjectId(taskId),
        save: jest.fn().mockResolvedValue({ ...mockTask, status: TaskStatus.COMPLETED, completedAt: new Date() }),
        populate: jest.fn().mockReturnThis(),
      };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(taskWithSave),
      });

      await service.update(taskId, { status: TaskStatus.COMPLETED }, mockUser.uuid);

      expect(taskWithSave.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const taskId = new Types.ObjectId().toString();

    it('should delete task successfully', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      });
      taskModel.deleteOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await service.delete(taskId, mockUser.uuid);

      expect(result.message).toBe('Task deleted successfully');
    });

    it('should throw BadRequestException for invalid task id', async () => {
      await expect(service.delete('invalid-id', mockUser.uuid)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete(taskId, 'not-found')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a manager', async () => {
      const nonManagerUser = { ...mockUser, role: 'user' };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(nonManagerUser),
      });

      await expect(service.delete(taskId, mockUser.uuid)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when task not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete(taskId, mockUser.uuid)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyTasks', () => {
    it('should return tasks assigned to user', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      taskModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockTask]),
          }),
        }),
      });

      const result = await service.findMyTasks(mockUser.uuid);

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findMyTasks('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
