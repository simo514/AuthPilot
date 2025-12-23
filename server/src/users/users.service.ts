import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, RoleDocument } from '../roles/role.schema';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const {fullName, email, password, roleId, department} = createUserDto;
    
    let finalRoleId = roleId;
    let roleName = 'user';

    // If no roleId provided, find the default 'user' role
    if (!roleId) {
      const defaultRole = await this.roleModel.findOne({ name: /^user$/i }).exec();
      if (!defaultRole) {
        throw new InternalServerErrorException('Default user role not found in database');
      }
      finalRoleId = defaultRole._id.toString();
      roleName = defaultRole.name.toLowerCase();
    } else {
      // Validate roleId exists
      const roleDoc = await this.roleModel.findById(roleId).exec();
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
      ...(department && { department }),
    });
    try {
      await createdUser.save();
      this.logger.log(`User created successfully: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to create user: ${email}`, error.stack);
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
    return plainToInstance(UserResponseDto, createdUser, { excludeExtraneousValues: true });
  }

  async updateUser (uuid: string, updateData: UpdateUserDto): Promise<Omit<User, 'password'> | null> {
    this.logger.log(`Updating user: ${uuid}`);
    const dataToUpdate = { ...updateData } as any;

    // Never allow password updates through this endpoint
    if (dataToUpdate.password) {
      delete dataToUpdate.password;
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

  async getAllUsers(department?: string, role?: string, status?: string): Promise<Omit<User, 'password'>[]> {
    const filter: any = {};
    
    if (department) {
      filter.department = department;
    }
    
    if (role) {
      filter.role = role;
    }

    if(status) {
      filter.status = status;
    }
    
    try {
      const users = await this.userModel
        .find(filter)
        .select('-password')
        .populate('roleId', 'name permissions isActive level')
        .lean()
        .exec();
      return users;
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
      const result = await this.userModel.deleteOne({ uuid }).exec();
      
      if (result.deletedCount === 0) {
        this.logger.warn(`User not found for deletion: ${uuid}`);
        return false;
      }
      
      this.logger.log(`User deleted successfully: ${uuid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete user: ${uuid}`, error.stack);
      throw new InternalServerErrorException('Failed to delete user');
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
        .findOneAndUpdate(
          { uuid },
          { lastLoginAt: new Date() },
          { new: true }
        )
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update last login: ${uuid}`, error.stack);
    }
  }

  async updateRefreshToken(uuid: string, refreshToken: string): Promise<void> {
    try {
      await this.userModel
        .findOneAndUpdate(
          { uuid },
          { refreshToken },
          { new: true }
        )
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update refresh token: ${uuid}`, error.stack);
    }
  }

  async findByRefreshToken(refreshToken: string): Promise<UserDocument | null> {
    try {
      return await this.userModel
        .findOne({ refreshToken })
        .exec();
    } catch (error) {
      this.logger.error('Failed to find user by refresh token', error.stack);
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async updatePassword(uuid: string, newPassword: string): Promise<void> {
    this.logger.log(`Updating password for user: ${uuid}`);
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const result = await this.userModel
        .findOneAndUpdate(
          { uuid },
          { 
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
          },
          { new: true }
        )
        .exec();

      if (!result) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Password updated successfully for user: ${uuid}`);
    } catch (error) {
      this.logger.error(`Failed to update password: ${uuid}`, error.stack);
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
