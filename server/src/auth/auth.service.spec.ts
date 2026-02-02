import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// The InjectRedis decorator uses this token format
const DEFAULT_REDIS_TOKEN = 'default_IORedisModuleConnectionToken';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let redis: {
    setex: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  const mockUser = {
    uuid: 'test-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedPassword123',
    role: 'user',
  };

  const mockUserResponse = {
    uuid: 'test-uuid-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'user',
  };

  beforeEach(async () => {
    const mockUsersService = {
      createUser: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      comparePasswords: jest.fn(),
      updateLastLogin: jest.fn(),
      getUserById: jest.fn(),
      createUserWithGoogle: jest.fn(),
      updateGoogleId: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockRedis = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DEFAULT_REDIS_TOKEN, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    redis = module.get(DEFAULT_REDIS_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      usersService.createUser.mockResolvedValue(mockUserResponse as any);
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.getUserById.mockResolvedValue(mockUserResponse as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redis.setex.mockResolvedValue('OK');

      const result = await service.register(registerDto);

      expect(usersService.createUser).toHaveBeenCalledWith({
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: registerDto.password,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(redis.setex).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException if user retrieval fails after creation', async () => {
      usersService.createUser.mockResolvedValue(mockUserResponse as any);
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should successfully login a user with valid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.comparePasswords.mockResolvedValue(true);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      usersService.getUserById.mockResolvedValue(mockUserResponse as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redis.setex.mockResolvedValue('OK');

      const result = await service.login(email, password);

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(usersService.comparePasswords).toHaveBeenCalledWith(password, mockUser.password);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.uuid);
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      usersService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';

    it('should successfully refresh access token', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.uuid, email: mockUser.email });
      redis.get.mockResolvedValue(refreshToken);
      usersService.getUserById.mockResolvedValue(mockUserResponse as any);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(redis.get).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException when refresh token not found in Redis', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.uuid, email: mockUser.email });
      redis.get.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.uuid, email: mockUser.email });
      redis.get.mockResolvedValue('different-token');

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser.uuid, email: mockUser.email });
      redis.get.mockResolvedValue(refreshToken);
      usersService.getUserById.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully remove refresh token from Redis', async () => {
      redis.del.mockResolvedValue(1);

      await service.logout(mockUser.uuid);

      expect(redis.del).toHaveBeenCalledWith(`refresh_token:${mockUser.uuid}`);
    });
  });

  describe('googleLogin', () => {
    const googleUser = {
      email: 'google@example.com',
      fullName: 'Google User',
      googleId: 'google-id-123',
      picture: 'https://example.com/picture.jpg',
      accessToken: 'google-access-token',
    };

    it('should throw UnauthorizedException when no user provided', async () => {
      await expect(service.googleLogin(null as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should create new user when Google user does not exist', async () => {
      usersService.findByEmailWithPassword
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, googleId: googleUser.googleId } as any);
      usersService.createUserWithGoogle.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      usersService.getUserById.mockResolvedValue(mockUserResponse as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redis.setex.mockResolvedValue('OK');

      const result = await service.googleLogin(googleUser);

      expect(usersService.createUserWithGoogle).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should link existing account when user exists without Google ID', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({ ...mockUser, googleId: null } as any);
      usersService.updateGoogleId.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      usersService.getUserById.mockResolvedValue(mockUserResponse as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redis.setex.mockResolvedValue('OK');

      const result = await service.googleLogin(googleUser);

      expect(usersService.updateGoogleId).toHaveBeenCalledWith(mockUser.uuid, googleUser.googleId, googleUser.picture);
      expect(result).toBeDefined();
    });
  });
});
