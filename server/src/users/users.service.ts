import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<void> {
    const {fullName, email, password, role, department} = createUserDto;
    this.logger.log(`Creating user with email: ${email}, role: ${role}, department: ${department}`);
    
    const createdUser = new this.userModel({
      email,
      fullName,
      password: await bcrypt.hash(password, 10),
      ...(role && { role }),
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
  }

  async updateUser (uuid: string, updateData: UpdateUserDto): Promise<Omit<User, 'password'> | null> {
    this.logger.log(`Updating user: ${uuid}`);
    const dataToUpdate = { ...updateData } as any;

    // Never allow password updates through this endpoint
    if (dataToUpdate.password) {
      delete dataToUpdate.password;
    }

    try {
      const updated = await this.userModel
        .findOneAndUpdate({ uuid }, dataToUpdate, { new: true, runValidators: true })
        .select('-password') 
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
      const users = await this.userModel.find(filter).select('-password').lean().exec();
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
