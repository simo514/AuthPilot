import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors, UseGuards } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @UseInterceptors(AuditInterceptor)
    @HttpCode(HttpStatus.CREATED)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute for registration
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @UseInterceptors(AuditInterceptor)
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }
}
