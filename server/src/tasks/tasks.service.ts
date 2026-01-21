import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Project } from '../projects/project.schema';
import { User } from '../users/user.schema';
import { Organization } from '../organizations/organization.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    // Get the user creating the task
    const user = await this.userModel.findOne({ uuid: userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      throw new ForbiddenException('Only managers can create tasks');
    }

    // Verify project exists and get organization
    const project = await this.projectModel
      .findOne({ uuid: createTaskDto.project })
      .populate('organizationId')
      .exec();
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If assignedTo is provided, verify the user exists and is assigned to the project
    let assignedToId: Types.ObjectId | undefined;
    if (createTaskDto.assignedTo) {
      const assignedUser = await this.userModel.findOne({ uuid: createTaskDto.assignedTo }).exec();
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
      // Verify the user is assigned to this project
      if (!assignedUser.projectId || assignedUser.projectId.toString() !== project._id.toString()) {
        throw new BadRequestException('User must be assigned to this project before being assigned tasks');
      }
      assignedToId = assignedUser._id as Types.ObjectId;
    }

    const task = new this.taskModel({
      title: createTaskDto.title,
      description: createTaskDto.description,
      project: project._id,
      organization: project.organizationId,
      createdBy: user._id,
      assignedTo: assignedToId,
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    return await task.save();
  }

  async findAll(): Promise<Task[]> {
    const filter: any = {};
    
    // Filter by organization from tenant context
    const organizationId = this.tenantContext.getOrganizationId();
    if (organizationId) {
      const organization = await this.organizationModel.findOne({ uuid: organizationId }).exec();
      if (organization) {
        filter.organization = organization._id;
      }
    }
    
    return await this.taskModel
      .find(filter)
      .populate('project')
      .populate('createdBy', 'uuid email fullName')
      .populate('assignedTo', 'uuid email fullName')
      .exec();
  }

  async findByProject(projectUuid: string): Promise<Task[]> {
    const project = await this.projectModel.findOne({ uuid: projectUuid }).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.taskModel
      .find({ project: project._id })
      .populate('createdBy', 'uuid email fullName')
      .populate('assignedTo', 'uuid email fullName')
      .exec();
  }

  async findOne(id: string): Promise<Task> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const task = await this.taskModel
      .findById(id)
      .populate('project')
      .populate('createdBy', 'uuid email fullName')
      .populate('assignedTo', 'uuid email fullName')
      .exec();
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const user = await this.userModel.findOne({ uuid: userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      throw new ForbiddenException('Only managers can update tasks');
    }

    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // If assignedTo is being updated, verify the user exists and is assigned to the project
    if (updateTaskDto.assignedTo) {
      const assignedUser = await this.userModel.findOne({ uuid: updateTaskDto.assignedTo }).exec();
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
      // Get the project for this task to validate
      const taskProject = await this.projectModel.findById(task.project).exec();
      if (taskProject && (!assignedUser.projectId || assignedUser.projectId.toString() !== taskProject._id.toString())) {
        throw new BadRequestException('User must be assigned to this project before being assigned tasks');
      }
      task.assignedTo = assignedUser._id as Types.ObjectId;
    }

    // Update other fields
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.status) {
      task.status = updateTaskDto.status;
      // If status is completed, set completedAt
      if (updateTaskDto.status === TaskStatus.COMPLETED && !task.completedAt) {
        task.completedAt = new Date();
      }
    }
    if (updateTaskDto.priority) task.priority = updateTaskDto.priority;
    if (updateTaskDto.dueDate) task.dueDate = new Date(updateTaskDto.dueDate);

    const updatedTask = await task.save();
    await updatedTask.populate('createdBy', 'uuid email fullName');
    await updatedTask.populate('assignedTo', 'uuid email fullName');
    
    return updatedTask;
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid task ID');
    }

    const user = await this.userModel.findOne({ uuid: userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      throw new ForbiddenException('Only managers can delete tasks');
    }

    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskModel.deleteOne({ _id: id });
    return { message: 'Task deleted successfully' };
  }

  async findMyTasks(userId: string): Promise<Task[]> {
    const user = await this.userModel.findOne({ uuid: userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.taskModel
      .find({ assignedTo: user._id })
      .populate('project')
      .populate('createdBy', 'uuid email fullName')
      .exec();
  }
}
