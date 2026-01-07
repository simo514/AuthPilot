import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('server');
  const app = await NestFactory.create(AppModule);
  
  // Security: Helmet
  app.use(helmet());
  
  // Cookie Parser
  app.use(cookieParser());
  
  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
