import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UseGuards,
  Headers,
  Res,
  Req,
  HttpException,
  Get,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleUserDto } from './dto/google-user.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);

    // Set refresh token as HttpOnly secure cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    // Set refresh token as HttpOnly secure cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new HttpException('Refresh token not found', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.authService.refreshToken(refreshToken);

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authorization?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (authorization && authorization.startsWith('Bearer ')) {
      try {
        const token = authorization.substring(7);
        const decoded = this.jwtService.decode(token) as JwtPayload;
        if (decoded?.sub) {
          await this.authService.logout(decoded.sub);
        }
      } catch (error) {
        this.logger.warn('Failed to decode token during logout');
      }
    }

    res?.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseInterceptors(AuditInterceptor)
  async googleAuthCallback(@Req() req: RequestWithGoogleUser, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    // Set refresh token as HttpOnly secure cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with tokens in URL params (temporary solution)
    // In production, consider using a different approach for better security
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accessToken = encodeURIComponent(result.accessToken);
    const user = encodeURIComponent(JSON.stringify(result.user));

    res.redirect(`${frontendUrl}/auth/google/callback?accessToken=${accessToken}&user=${user}`);
  }
}
