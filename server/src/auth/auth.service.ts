import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private logger = new Logger(AuthService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
        const { fullName, email, password, department } = registerDto;
        
        await this.usersService.createUser({ fullName, email, password, department });
        this.logger.log(`User registered successfully: ${email}`);

        const user = await this.usersService.findByEmailWithPassword(email);
        if (!user) {
            throw new UnauthorizedException('Failed to retrieve created user');
        }

        // Generate JWT tokens
        const payload = { 
            email: user.email, 
            sub: user.uuid,
            role: user.role 
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Store refresh token in database
        await this.usersService.updateRefreshToken(user.uuid, refreshToken);

        // Get user data without password
        const userData = await this.usersService.getUserById(user.uuid);

        this.logger.log(`Tokens generated for registered user: ${email}`);
        
        // Transform to DTO to remove sensitive fields
        return plainToInstance(LoginResponseDto, {
            accessToken,
            refreshToken,
            user: userData
        }, { 
            excludeExtraneousValues: true,
            enableImplicitConversion: true 
        });
    }


    async login(email: string, password: string): Promise<LoginResponseDto> {
        // Find user by email with password
        const user = await this.usersService.findByEmailWithPassword(email);
        if (!user) {
            this.logger.warn(`User not found during login: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Compare passwords
        const isPasswordValid = await this.usersService.comparePasswords(
            password, 
            user.password
        );
        if (!isPasswordValid) {
            this.logger.warn(`Invalid password for user: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.usersService.updateLastLogin(user.uuid);

        // Generate JWT tokens
        const payload = { 
            email: user.email, 
            sub: user.uuid,
            role: user.role 
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Store refresh token in database
        await this.usersService.updateRefreshToken(user.uuid, refreshToken);

        // Get user data without password
        const userData = await this.usersService.getUserById(user.uuid);

        this.logger.log(`User logged in successfully: ${email}`);
        
        // Transform to DTO to remove sensitive fields
        return plainToInstance(LoginResponseDto, {
            accessToken,
            refreshToken,
            user: userData
        }, { 
            excludeExtraneousValues: true,
            enableImplicitConversion: true 
        });
    }

    async refreshToken(refreshToken: string): Promise<RefreshResponseDto> {
        try {
            // Verify the refresh token
            const decoded = this.jwtService.verify(refreshToken);
            
            // Find user by refresh token
            const user = await this.usersService.findByRefreshToken(refreshToken);
            if (!user) {
                this.logger.warn('Invalid refresh token: not found in database');
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new tokens
            const payload = { 
                email: user.email, 
                sub: user.uuid,
                role: user.role 
            };
            const newAccessToken = this.jwtService.sign(payload);
            const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

            // Update refresh token in database
            await this.usersService.updateRefreshToken(user.uuid, newRefreshToken);

            this.logger.log(`Tokens refreshed for user: ${user.email}`);
            
            // Transform to DTO
            return plainToInstance(RefreshResponseDto, {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }, { excludeExtraneousValues: true });
        } catch (error) {
            this.logger.warn('Invalid or expired refresh token');
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}
