import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, RoleDocument } from '../roles/role.schema';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { Organization, OrganizationDocument } from '../organizations/organization.schema';
import { Project } from '../projects/project.schema';
import { TenantContextService } from '../organizations/tenant-context.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private readonly tenantContext: TenantContextService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { fullName, email, password, roleId, role, managerId, organizationId } = createUserDto;

    // If role looks like a MongoDB ObjectId (24 hex chars), treat it as roleId
    const isRoleAnObjectId = role && /^[0-9a-fA-F]{24}$/.test(role);
    let finalRoleId = roleId || (isRoleAnObjectId ? role : null);

    this.logger.debug(
      `createUser called with roleId: ${roleId}, role: ${role}, finalRoleId: ${finalRoleId}`,
    );

    let roleName = 'user';

    // If no roleId provided, find the default 'user' role
    if (!finalRoleId) {
      const defaultRole = await this.roleModel.findOne({ name: /^user$/i }).exec();
      if (!defaultRole) {
        throw new InternalServerErrorException('Default user role not found in database');
      }
      finalRoleId = defaultRole._id.toString();
      roleName = defaultRole.name.toLowerCase();
    } else {
      // Validate roleId exists
      const roleDoc = await this.roleModel.findById(finalRoleId).exec();
      if (!roleDoc) {
        throw new BadRequestException('Invalid roleId: Role does not exist');
      }

      if (!roleDoc.isActive) {
        throw new BadRequestException('Cannot assign inactive role to user');
      }

      // Map role name to UserRole enum (convert to lowercase to match enum)
      roleName = roleDoc.name.toLowerCase();
    }

    const createdUser = new this.userModel({
      email,
      fullName,
      password: await bcrypt.hash(password, 10),
      roleId: finalRoleId,
      role: roleName,
      managerId,
      ...(organizationId && { organizationId }),
    });
    
    
    try {
      await createdUser.save();
      this.logger.log(`User created successfully: ${email} with role: ${roleName}`);

      // Fetch the user with populated role to return complete data
      const userWithRole = await this.userModel.findById(createdUser._id).populate('roleId').exec();

      return plainToInstance(UserResponseDto, userWithRole, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to create user: ${email}`, error.stack);
      if (error.code === 11000) {
        // Check which field caused the duplicate key error
        const duplicateField = error.keyPattern ? Object.keys(error.keyPattern) : [];
        
        // Check if email is in the duplicate fields (could be part of compound index)
        if (duplicateField.includes('email')) {
          throw new ConflictException('User with this email already exists');
        } else if (duplicateField.includes('googleId')) {
          throw new ConflictException('Google ID already exists');
        } else {
          throw new ConflictException(`Duplicate ${duplicateField.join(', ')} already exists`);
        }
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateUser(
    uuid: string,
    updateData: UpdateUserDto,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.log(`Updating user: ${uuid}`);
    const dataToUpdate = { ...updateData } as any;

    // Security: Never allow password updates through this endpoint
    if (dataToUpdate.password) {
      delete dataToUpdate.password;
    }

    // Security: Prevent direct role manipulation - role is derived from roleId
    if (dataToUpdate.role) {
      delete dataToUpdate.role;
    }

    // Validate roleId if provided and sync role field
    if (updateData.roleId) {
      const roleDoc = await this.roleModel.findById(updateData.roleId).exec();
      if (!roleDoc) {
        throw new BadRequestException('Invalid roleId: Role does not exist');
      }
      if (!roleDoc.isActive) {
        throw new BadRequestException('Cannot assign inactive role to user');
      }
      // Automatically update role field based on roleId
      dataToUpdate.role = roleDoc.name.toLowerCase();
    }

    try {
      const updated = await this.userModel
        .findOneAndUpdate({ uuid }, dataToUpdate, { new: true, runValidators: true })
        .select('-password')
        .populate('roleId', 'name permissions isActive level')
        .lean()
        .exec();

      if (!updated) {
        this.logger.warn(`User not found for update: ${uuid}`);
        return null;
      }

      this.logger.log(`User updated successfully: ${uuid}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update user: ${uuid}`, error.stack);
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string,
  ): Promise<{ users: Omit<User, 'password'>[]; total: number; page: number; totalPages: number }> {
    const filter: any = {};

    // Filter by organization from tenant context
    const organizationId = this.tenantContext.getOrganizationId();
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    try {
      const total = await this.userModel.countDocuments(filter);
      const users = await this.userModel
        .find(filter)
        .select('-password')
        .populate('roleId', 'name permissions isActive level')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', error.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUserById(uuid: string): Promise<Omit<User, 'password'> | null> {
    this.logger.log(`Fetching user by id: ${uuid}`);
    try {
      const user = await this.userModel
        .findOne({ uuid })
        .select('-password')
        .populate('roleId', 'name permissions isActive level -_id')
        .lean()
        .exec();

      if (!user) {
        this.logger.warn(`User not found: ${uuid}`);
        return null;
      }

      this.logger.log(`User retrieved successfully: ${uuid}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch user: ${uuid}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async deleteUser(uuid: string): Promise<boolean> {
    this.logger.log(`Deleting user: ${uuid}`);
    try {
      // Get user's organizationId and projectId before deletion
      const user = await this.userModel.findOne({ uuid }).select('organizationId projectId').exec();
      
      if (!user) {
        this.logger.warn(`User not found for deletion: ${uuid}`);
        return false;
      }

      const organizationId = user.organizationId;
      const projectId = user.projectId;

      // Delete the user
      const result = await this.userModel.deleteOne({ uuid }).exec();

      if (result.deletedCount === 0) {
        this.logger.warn(`User deletion failed: ${uuid}`);
        return false;
      }

      // Decrement the organization's currentUsers count if user was assigned to an organization
      if (organizationId) {
        await this.organizationsService.decrementUserCount(organizationId);
        this.logger.log(`Decremented currentUsers for organization: ${organizationId}`);
      }

      // Decrement the project's currentUsers count if user was assigned to a project
      if (projectId) {
        await this.projectModel.updateOne(
          { uuid: projectId },
          { $inc: { currentUsers: -1 } },
        ).exec();
        this.logger.log(`Decremented currentUsers for project: ${projectId}`);
      }

      this.logger.log(`User deleted successfully: ${uuid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete user: ${uuid}`, error.stack);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async getManagers(): Promise<Omit<User, 'password'>[]> {
    try {
      const managers = await this.userModel
        .find({ role: 'manager' })
        .select('-password')
        .populate('roleId', 'name permissions isActive level -_id')
        .lean()
        .exec();

      this.logger.log(`Retrieved ${managers.length} managers`);
      return managers;
    } catch (error) {
      this.logger.error('Failed to fetch managers', error.stack);
      throw new InternalServerErrorException('Failed to fetch managers');
    }
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    try {
      const user = await this.userModel
        .findOne({ email: email.toLowerCase() })
        .select('+password')
        .exec();

      if (!user) {
        this.logger.warn(`User not found: ${email}`);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch user with password: ${email}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async updateLastLogin(uuid: string): Promise<void> {
    try {
      await this.userModel
        .findOneAndUpdate({ uuid }, { lastLoginAt: new Date() }, { new: true })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update last login: ${uuid}`, error.stack);
    }
  }

  async updatePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user with password
      const user = await this.userModel
        .findOne({ email: email.toLowerCase() })
        .select('+password')
        .exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Compare current password
      const isMatch = await this.comparePasswords(currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      this.logger.log(`Password updated successfully for user: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to update password: ${email}`, error.stack);
      throw error instanceof NotFoundException || error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to update password');
    }
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createUserWithGoogle(data: {
    fullName: string;
    email: string;
    password: string;
    googleId: string;
    picture?: string;
  }): Promise<UserResponseDto> {
    const { fullName, email, password, googleId, picture } = data;

    // Find default 'user' role
    const defaultRole = await this.roleModel.findOne({ name: /^user$/i }).exec();
    if (!defaultRole) {
      throw new InternalServerErrorException('Default user role not found in database');
    }

    const createdUser = new this.userModel({
      email,
      fullName,
      password: await bcrypt.hash(password, 10),
      roleId: defaultRole._id.toString(),
      role: defaultRole.name.toLowerCase(),
      googleId,
      picture,
      organizationId: null,
    });

    try {
      await createdUser.save();
      this.logger.log(`User created via Google OAuth: ${email}`);

      const userWithRole = await this.userModel.findById(createdUser._id).populate('roleId').exec();

      return plainToInstance(UserResponseDto, userWithRole, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to create user via Google OAuth: ${email}`, error.stack);
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateGoogleId(uuid: string, googleId: string, picture?: string): Promise<void> {
    try {
      await this.userModel
        .findOneAndUpdate({ uuid }, { googleId, ...(picture && { picture }) }, { new: true })
        .exec();
      this.logger.log(`Google ID linked to user: ${uuid}`);
    } catch (error) {
      this.logger.error(`Failed to update Google ID for user: ${uuid}`, error.stack);
      throw new InternalServerErrorException('Failed to link Google account');
    }
  }

  async assignUserToOrganization(userUuid: string, organizationId: string): Promise<void> {
    try {
      const user = await this.userModel.findOne({ uuid: userUuid }).exec();
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if organization exists
      const organization = await this.organizationModel.findOne({ uuid: organizationId }).exec();
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Check if user is already assigned to this organization
      if (user.organizationId === organizationId) {
        this.logger.warn(`User ${userUuid} is already assigned to organization ${organizationId}`);
        return;
      }

      // If user was previously assigned to a different organization, decrement that org's count
      if (user.organizationId) {
        await this.organizationModel.updateOne(
          { uuid: user.organizationId },
          { $inc: { currentUsers: -1 } },
        ).exec();
      }

      // Assign user to new organization
      user.organizationId = organizationId;
      await user.save();

      // Increment the organization's currentUsers count
      await this.organizationModel.updateOne(
        { uuid: organizationId },
        { $inc: { currentUsers: 1 } },
      ).exec();
      
      this.logger.log(`User ${userUuid} assigned to organization: ${organizationId}`);
    } catch (error) {
      this.logger.error(`Failed to assign user to organization: ${userUuid}`, error.stack);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to assign user to organization');
    }
  }

  async removeUserFromOrganization(userUuid: string): Promise<void> {
    try {
      const user = await this.userModel.findOne({ uuid: userUuid }).exec();
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const previousOrgId = user.organizationId;

      // Remove user from organization
      user.organizationId = null;
      await user.save();

      // Decrement the organization's currentUsers count
      if (previousOrgId) {
        await this.organizationModel.updateOne(
          { uuid: previousOrgId },
          { $inc: { currentUsers: -1 } },
        ).exec();
      }
      
      this.logger.log(`User ${userUuid} removed from organization`);
    } catch (error) {
      this.logger.error(`Failed to remove user from organization: ${userUuid}`, error.stack);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to remove user from organization');
    }
  }

  async getUsersByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: Omit<User, 'password'>[]; total: number; page: number; totalPages: number }> {
    try {
      const filter = { organizationId };
      const total = await this.userModel.countDocuments(filter);
      const users = await this.userModel
        .find(filter)
        .select('-password')
        .populate('roleId', 'name permissions isActive level')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch users by organization', error.stack);
      throw new InternalServerErrorException('Failed to fetch users by organization');
    }
  }

  async getUnassignedUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: Omit<User, 'password'>[]; total: number; page: number; totalPages: number }> {
    try {
      const filter = { $or: [{ organizationId: null }, { organizationId: { $exists: false } }] };
      const total = await this.userModel.countDocuments(filter);
      const users = await this.userModel
        .find(filter)
        .select('-password')
        .populate('roleId', 'name permissions isActive level')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch unassigned users', error.stack);
      throw new InternalServerErrorException('Failed to fetch unassigned users');
    }
  }

  async assignUserToProject(userUuid: string, projectUuid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findOne({ uuid: userUuid }).populate('roleId').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = await this.projectModel.findOne({ uuid: projectUuid }).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If user already has a project, remove them from it first
    if (user.projectId) {
      await this.removeUserFromProject(userUuid);
    }

    user.projectId = project._id.toString();
    await user.save();

    // Increment project's currentUsers count
    await this.projectModel.updateOne(
      { uuid: projectUuid },
      { $inc: { currentUsers: 1 } }
    );

    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  async removeUserFromProject(userUuid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findOne({ uuid: userUuid }).populate('roleId').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.projectId) {
      throw new BadRequestException('User is not assigned to any project');
    }

    const projectId = user.projectId;
    user.projectId = null;
    await user.save();

    // Decrement project's currentUsers count
    const project = await this.projectModel.findById(projectId).exec();
    if (project) {
      await this.projectModel.updateOne(
        { _id: projectId },
        { $inc: { currentUsers: -1 } }
      );
    }

    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
