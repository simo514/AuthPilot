import { Body, Controller, Patch, Post, UsePipes, ValidationPipe, Param, NotFoundException, Get, Query, Delete, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';
import { UserRole } from './enums/user-role.enum';
import { UserDepartment } from './enums/user-department.enum';

@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(private usersService: UsersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createUser(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
        await this.usersService.createUser(createUserDto);
        return { message: 'User created successfully' };
    }

    @Patch(':uuid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateUser(
        @Param('uuid') uuid: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<Omit<User, 'password'>> {
        this.logger.log(`PATCH /users/${uuid} - Updating user`);
        const updated = await this.usersService.updateUser(uuid, updateUserDto);
        if (!updated) {
            this.logger.warn(`User not found: ${uuid}`);
            throw new NotFoundException('User not found');
        }
        return updated;
    }

    @Get()
    async getAllUsers(
        @Query('department') department?: string,
        @Query('role') role?: string,
    ): Promise<Omit<User, 'password'>[]> {
        this.logger.log(`GET /users - Fetching users with filters`);
        return this.usersService.getAllUsers(department, role);
    }

    @Get(':uuid')
    async getUserById(@Param('uuid') uuid: string): Promise<Omit<User, 'password'>> {
        this.logger.log(`GET /users/${uuid} - Fetching user`);
        const user = await this.usersService.getUserById(uuid);
        if (!user) {
            this.logger.warn(`User not found: ${uuid}`);
            throw new NotFoundException('User not found');
        }
        return user;
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
