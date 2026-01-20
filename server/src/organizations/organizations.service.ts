import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { plainToInstance } from 'class-transformer';
import { OrganizationStatus } from './enums/organization-status.enum';
import { Project } from '../projects/project.schema';
import { User } from '../users/user.schema';
import { Task } from '../tasks/task.schema';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const { slug, domain, name } = createOrganizationDto;

    // Check if slug already exists
    const existingSlug = await this.organizationModel.findOne({ slug }).exec();
    if (existingSlug) {
      throw new ConflictException('Organization slug already exists');
    }

    // Check if domain already exists (if provided)
    if (domain) {
      const existingDomain = await this.organizationModel
        .findOne({ domain })
        .exec();
      if (existingDomain) {
        throw new ConflictException('Organization domain already exists');
      }
    }

    try {
      const organization = new this.organizationModel(createOrganizationDto);
      await organization.save();

      this.logger.log(`Organization created: ${name} (${slug})`);

      return plainToInstance(OrganizationResponseDto, organization.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`);
      throw new BadRequestException('Failed to create organization');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: OrganizationStatus,
  ): Promise<{ organizations: OrganizationResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const [organizations, total] = await Promise.all([
      this.organizationModel.find(filter).skip(skip).limit(limit).exec(),
      this.organizationModel.countDocuments(filter).exec(),
    ]);

    return {
      organizations: organizations.map((org) =>
        plainToInstance(OrganizationResponseDto, org.toObject(), {
          excludeExtraneousValues: true,
        }),
      ),
      total,
    };
  }

  async findByUuid(uuid: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return plainToInstance(
      OrganizationResponseDto,
      organization.toObject(),
      { excludeExtraneousValues: true },
    );
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationModel.findOne({ slug }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return plainToInstance(
      OrganizationResponseDto,
      organization.toObject(),
      { excludeExtraneousValues: true },
    );
  }

  async findByDomain(domain: string): Promise<OrganizationResponseDto> {
    const organization = await this.organizationModel
      .findOne({ domain })
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return plainToInstance(
      OrganizationResponseDto,
      organization.toObject(),
      { excludeExtraneousValues: true },
    );
  }

  async update(
    uuid: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if slug is being updated and if it conflicts
    if (updateOrganizationDto.slug && updateOrganizationDto.slug !== organization.slug) {
      const existingSlug = await this.organizationModel
        .findOne({ slug: updateOrganizationDto.slug })
        .exec();
      if (existingSlug) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    // Check if domain is being updated and if it conflicts
    if (updateOrganizationDto.domain && updateOrganizationDto.domain !== organization.domain) {
      const existingDomain = await this.organizationModel
        .findOne({ domain: updateOrganizationDto.domain })
        .exec();
      if (existingDomain) {
        throw new ConflictException('Organization domain already exists');
      }
    }

    Object.assign(organization, updateOrganizationDto);
    await organization.save();

    this.logger.log(`Organization updated: ${organization.name} (${uuid})`);

    return plainToInstance(
      OrganizationResponseDto,
      organization.toObject(),
      { excludeExtraneousValues: true },
    );
  }

  async delete(uuid: string): Promise<void> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Delete all tasks in this organization
    await this.taskModel.deleteMany({ organization: organization._id }).exec();
    this.logger.log(`Deleted all tasks for organization: ${uuid}`);

    // Delete all projects in this organization
    await this.projectModel.deleteMany({ organizationId: organization._id }).exec();
    this.logger.log(`Deleted all projects for organization: ${uuid}`);

    // Set organizationId to null for all users in this organization
    await this.userModel.updateMany(
      { organizationId: organization._id },
      { $set: { organizationId: null, projectId: null } }
    ).exec();
    this.logger.log(`Unlinked all users from organization: ${uuid}`);

    // Finally, delete the organization
    await this.organizationModel.deleteOne({ uuid }).exec();

    this.logger.log(`Organization deleted: ${uuid}`);
  }

  async incrementUserCount(uuid: string): Promise<void> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.currentUsers >= organization.maxUsers) {
      throw new BadRequestException('Organization has reached maximum user limit');
    }

    organization.currentUsers += 1;
    await organization.save();
  }

  async decrementUserCount(uuid: string): Promise<void> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.currentUsers > 0) {
      organization.currentUsers -= 1;
      await organization.save();
    }
  }

  async updateStatus(
    uuid: string,
    status: OrganizationStatus,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationModel.findOne({ uuid }).exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    organization.status = status;
    await organization.save();

    this.logger.log(`Organization status updated: ${uuid} -> ${status}`);

    return plainToInstance(
      OrganizationResponseDto,
      organization.toObject(),
      { excludeExtraneousValues: true },
    );
  }
}
