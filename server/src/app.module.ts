import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Application
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        
        // Database
        DB_CONNECTION: Joi.string().required(),
        
        // JWT
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().optional(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        
        // Redis - either REDIS_URL (Render) or individual host/port/password
        REDIS_URL: Joi.string().optional(),
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        REDIS_PASSWORD: Joi.string().optional(),
        
        // Google OAuth (optional)
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CALLBACK_URL: Joi.string().optional(),
        
        // Frontend & CORS
        FRONTEND_URL: Joi.string().default('http://localhost:5173'),
        CORS_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:3000'),
        
        // Rate Limiting
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
        
        // Logging
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug', 'verbose').default('log'),
        
        // Audit
        AUDIT_LOG_RETENTION_DAYS: Joi.number().default(90),
      }),
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            type: 'single',
            url: redisUrl,
            options: {
              tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
              retryStrategy(times: number) {
                return Math.min(times * 50, 2000);
              },
            },
          };
        }
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const redisTls = configService.get<string>('REDIS_TLS');
        // Auto-enable TLS for port 6380 (Upstash/Redis Cloud TLS port) or if REDIS_TLS=true
        const useTls = redisTls === 'true' || port === 6380;
        return {
          type: 'single',
          options: {
            host,
            port,
            password,
            tls: useTls ? { rejectUnauthorized: false } : undefined,
            retryStrategy(times: number) {
              return Math.min(times * 50, 2000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    MongooseModule.forRoot(process.env.DB_CONNECTION),
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    UsersModule,
    RolesModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
