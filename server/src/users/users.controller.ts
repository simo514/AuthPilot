import { Body, Controller, Patch, Post, UsePipes, ValidationPipe, Param, NotFoundException, Get, Query, Delete, Logger, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('users')
@UseInterceptors(AuditInterceptor)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(private usersService: UsersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
       const user = await this.usersService.createUser(createUserDto);
        return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });  
    }

    @Get('/managers')
    @HttpCode(HttpStatus.OK)
    async getManagers(): Promise<UserResponseDto[]> {
        const managers = await this.usersService.getManagers();
        if (!managers) {
            this.logger.warn('No managers found');
            throw new NotFoundException('No managers found');
        }
        return plainToInstance(UserResponseDto, managers, { excludeExtraneousValues: true });
    }

    @Get('users-by-manager/:managerId')
    @HttpCode(HttpStatus.OK)
    async getUsersByManager(@Param('managerId') managerId: string): Promise<UserResponseDto[]> {
        const users = await this.usersService.getUsersbyManager(managerId);
        if (!users) {
            this.logger.warn(`No users found for manager: ${managerId}`);
            throw new NotFoundException('No users found for this manager');
        }
        return plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true });
    }

    @Patch('password')
    @UsePipes(new ValidationPipe({ transform: true }))
    async resetPassword(
        @Body('email') email: string,
        @Body('currentPassword') currentPassword: string,
        @Body('newPassword') newPassword: string,
    ): Promise<{ message: string }> {
        this.logger.log(`${email}/password - Resetting password`);
        await this.usersService.updatePassword(email, currentPassword, newPassword);
        return { message: 'Password updated successfully' };
    }

    @Patch(':uuid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateUser(
        @Param('uuid') uuid: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        this.logger.log(`PATCH /users/${uuid} - Updating user`);
        const updated = await this.usersService.updateUser(uuid, updateUserDto);
        if (!updated) {
            this.logger.warn(`User not found: ${uuid}`);
            throw new NotFoundException('User not found');
        }
        return plainToInstance(UserResponseDto, updated, { excludeExtraneousValues: true });
    }

    @Get()
    async getAllUsers(
        @Query('department') department?: string,
        @Query('role') role?: string,
    ): Promise<UserResponseDto[]> {
        this.logger.log(`GET /users - Fetching users with filters`);
        const users = await this.usersService.getAllUsers(department, role);
        return plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true });
    }

    @Get(':uuid')
    async getUserById(  @Param('uuid', new ParseUUIDPipe()) uuid: string,): Promise<UserResponseDto> {
        this.logger.log(`GET /users/${uuid} - Fetching user`);
        const user = await this.usersService.getUserById(uuid);
        if (!user) {
            this.logger.warn(`User not found: ${uuid}`);
            throw new NotFoundException('User not found');
        }
        return plainToInstance(UserResponseDto, user, { 
            excludeExtraneousValues: true,
            enableImplicitConversion: true 
        });
    }

    @Delete(':uuid')
    @HttpCode(HttpStatus.OK)
    async deleteUser(@Param('uuid') uuid: string): Promise<{ message: string }> {
        this.logger.log(`DELETE /users/${uuid} - Deleting user`);
        const deleted = await this.usersService.deleteUser(uuid);
        if (!deleted) {
            this.logger.warn(`User not found for deletion: ${uuid}`);
            throw new NotFoundException('User not found');
        }
        return { message: 'User deleted successfully' };
    }
}
