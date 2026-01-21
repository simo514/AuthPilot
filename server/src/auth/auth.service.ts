import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleUserDto } from './dto/google-user.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const { fullName, email, password } = registerDto;

    await this.usersService.createUser({ fullName, email, password });
    this.logger.log(`User registered successfully: ${email}`);

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Failed to retrieve created user');
    }

    // Generate JWT tokens
    const payload = {
      email: user.email,
      sub: user.uuid,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis with expiration
    await this.redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${user.uuid}`,
      this.REFRESH_TOKEN_TTL,
      refreshToken,
    );

    // Get user data without password
    const userData = await this.usersService.getUserById(user.uuid);

    this.logger.log(`Tokens generated for registered user: ${email}, stored in Redis`);

    // Transform to DTO to remove sensitive fields
    return plainToInstance(
      LoginResponseDto,
      {
        accessToken,
        refreshToken,
        user: userData,
      },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    );
  }

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      this.logger.warn(`User not found during login: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    const isPasswordValid = await this.usersService.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.uuid);

    // Generate JWT tokens
    const payload = {
      email: user.email,
      sub: user.uuid,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis with expiration
    await this.redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${user.uuid}`,
      this.REFRESH_TOKEN_TTL,
      refreshToken,
    );

    const userData = await this.usersService.getUserById(user.uuid);

    this.logger.log(`User logged in successfully: ${email}, session stored in Redis`);

    return plainToInstance(
      LoginResponseDto,
      {
        accessToken,
        refreshToken,
        user: userData,
      },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    );
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponseDto> {
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken);
      const userUuid = decoded.sub;

      // Check if refresh token exists in Redis
      const storedToken = await this.redis.get(`${this.REFRESH_TOKEN_PREFIX}${userUuid}`);
      if (!storedToken || storedToken !== refreshToken) {
        this.logger.warn('Invalid refresh token: not found in Redis or mismatch');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user data
      const user = await this.usersService.getUserById(userUuid);
      if (!user) {
        this.logger.warn('User not found for refresh token');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const payload = {
        email: user.email,
        sub: user.uuid,
        role: user.role,
        organizationId: user.organizationId,
      };
      const newAccessToken = this.jwtService.sign(payload);

      this.logger.log(`Access token refreshed for user: ${user.email}`);

      return plainToInstance(
        RefreshResponseDto,
        {
          accessToken: newAccessToken,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.warn('Invalid or expired refresh token');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Add logout method to remove session from Redis
  async logout(userUuid: string): Promise<void> {
    await this.redis.del(`${this.REFRESH_TOKEN_PREFIX}${userUuid}`);
    this.logger.log(`User session removed from Redis: ${userUuid}`);
  }

  async googleLogin(user: GoogleUserDto): Promise<LoginResponseDto> {
    if (!user) {
      throw new UnauthorizedException('No user from Google');
    }

    const { email, fullName, googleId, picture } = user;

    // Check if user exists with this Google ID or email
    let existingUser = await this.usersService.findByEmailWithPassword(email);

    if (!existingUser) {
      // Create new user with Google account
      await this.usersService.createUserWithGoogle({
        fullName,
        email,
        password: `google-${googleId}-${Date.now()}`, // Random password for Google users
        googleId,
        picture,
      });
      existingUser = await this.usersService.findByEmailWithPassword(email);
    } else if (!existingUser.googleId) {
      // Link existing account with Google
      this.logger.log(`Linking existing account with Google: ${email}`);
      await this.usersService.updateGoogleId(existingUser.uuid, googleId, picture);
    }

    if (!existingUser) {
      throw new UnauthorizedException('Failed to retrieve or create user');
    }

    // Update last login
    await this.usersService.updateLastLogin(existingUser.uuid);

    // Generate JWT tokens
    const payload = {
      email: existingUser.email,
      sub: existingUser.uuid,
      role: existingUser.role,
      organizationId: existingUser.organizationId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis
    await this.redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${existingUser.uuid}`,
      this.REFRESH_TOKEN_TTL,
      refreshToken,
    );

    // Get user data without password
    const userData = await this.usersService.getUserById(existingUser.uuid);

    this.logger.log(`Google OAuth login successful: ${email}`);

    return plainToInstance(
      LoginResponseDto,
      {
        accessToken,
        refreshToken,
        user: userData,
      },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    );
  }
}
