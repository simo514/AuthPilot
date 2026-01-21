import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Project } from './project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { Organization } from '../organizations/organization.schema';
import { User } from '../users/user.schema';
import { Task } from '../tasks/task.schema';
import { TenantContextService } from '../organizations/tenant-context.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    // Verify organization exists and convert UUID to MongoDB ObjectId
    const organization = await this.organizationModel.findOne({ uuid: createProjectDto.organizationId }).exec();
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if slug already exists
    const existingProject = await this.projectModel.findOne({ slug: createProjectDto.slug });
    if (existingProject) {
      throw new ConflictException('Project slug already exists');
    }

    const project = new this.projectModel({
      ...createProjectDto,
      organizationId: organization._id,
      uuid: uuidv4(),
    });

    const savedProject = await project.save();
    return this.toResponseDto(savedProject, organization.name);
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const filter: any = {};
    
    // Filter by organization from tenant context
    const organizationId = this.tenantContext.getOrganizationId();
    if (organizationId) {
      const organization = await this.organizationModel.findOne({ uuid: organizationId }).exec();
      if (organization) {
        filter.organizationId = organization._id;
      }
    }
    
    const projects = await this.projectModel.find(filter).populate('organizationId', 'name').exec();
    return projects.map(project => this.toResponseDto(project));
  }

  async findByOrganization(organizationId: string): Promise<ProjectResponseDto[]> {
    // Find organization by UUID first
    const organization = await this.organizationModel.findOne({ uuid: organizationId }).exec();
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const projects = await this.projectModel
      .find({ organizationId: organization._id })
      .populate('organizationId', 'name')
      .exec();
    return projects.map(project => this.toResponseDto(project));
  }

  async findUserProjects(userUuid: string): Promise<ProjectResponseDto[]> {
    // Find the user
    const user = await this.userModel.findOne({ uuid: userUuid }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has a projectId, get that specific project
    if (user.projectId) {
      const project = await this.projectModel
        .findOne({ _id: user.projectId })
        .populate('organizationId', 'name')
        .exec();
      
      if (project) {
        return [this.toResponseDto(project)];
      }
    }

    // Otherwise, get projects where user is assigned through tasks
    const tasks = await this.taskModel
      .find({ assignedTo: user._id })
      .populate({
        path: 'project',
        populate: {
          path: 'organizationId',
          select: 'name'
        }
      })
      .exec();

    // Get unique projects from tasks
    const projectMap = new Map();
    tasks.forEach(task => {
      if (task.project && typeof task.project === 'object') {
        const project = task.project as any;
        if (!projectMap.has(project._id.toString())) {
          projectMap.set(project._id.toString(), project);
        }
      }
    });

    const projects = Array.from(projectMap.values());
    return projects.map(project => this.toResponseDto(project));
  }

  async findByUuid(uuid: string): Promise<ProjectResponseDto> {
    const project = await this.projectModel
      .findOne({ uuid })
      .populate('organizationId', 'name')
      .exec();
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    return this.toResponseDto(project);
  }

  async update(uuid: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOne({ uuid });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if slug is being updated and if it already exists
    if (updateProjectDto.slug && updateProjectDto.slug !== project.slug) {
      const existingProject = await this.projectModel.findOne({ slug: updateProjectDto.slug });
      if (existingProject) {
        throw new ConflictException('Project slug already exists');
      }
    }

    Object.assign(project, updateProjectDto);
    const updatedProject = await project.save();
    
    await updatedProject.populate('organizationId', 'name');
    return this.toResponseDto(updatedProject);
  }

  async delete(uuid: string): Promise<{ message: string }> {
    const project = await this.projectModel.findOne({ uuid });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Delete all tasks in this project
    await this.taskModel.deleteMany({ project: project._id });

    // Unlink users from this project (set projectId to null)
    await this.userModel.updateMany(
      { projectId: project._id },
      { $set: { projectId: null } }
    );

    // Delete the project
    await this.projectModel.deleteOne({ uuid });
    return { message: 'Project deleted successfully' };
  }

  async getProjectUsers(uuid: string): Promise<any[]> {
    const project = await this.projectModel.findOne({ uuid });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const users = await this.userModel
      .find({ projectId: project._id })
      .select('uuid email fullName role')
      .exec();

    return users;
  }

  async getAvailableUsers(uuid: string): Promise<any[]> {
    const project = await this.projectModel.findOne({ uuid }).populate('organizationId').exec();
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get the organization UUID to match with users
    const organizationUuid = project.organizationId && typeof project.organizationId === 'object' 
      ? (project.organizationId as any).uuid 
      : null;

    if (!organizationUuid) {
      return [];
    }

    // Get users from the same organization who are not assigned to any project
    const users = await this.userModel
      .find({
        organizationId: organizationUuid,
        $or: [
          { projectId: { $exists: false } },
          { projectId: null }
        ]
      })
      .select('uuid email fullName role')
      .exec();

    return users;
  }

  private toResponseDto(project: any, organizationName?: string): ProjectResponseDto {
    const orgName = organizationName || 
      (project.organizationId?.name) || 
      (typeof project.organizationId === 'object' && project.organizationId?.name) || 
      undefined;

    return {
      uuid: project.uuid,
      name: project.name,
      description: project.description,
      slug: project.slug,
      organizationId: project.organizationId?._id?.toString() || project.organizationId?.toString(),
      organizationName: orgName,
      status: project.status,
      currentUsers: project.currentUsers,
      startDate: project.startDate,
      endDate: project.endDate,
      tags: project.tags || [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
