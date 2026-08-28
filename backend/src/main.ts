import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS — restrict to allowed origins
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Register global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Register global interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Fail-fast: validate critical secrets at startup
  if (
    !process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_ACCESS_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET must be set and at least 32 characters',
    );
  }
  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set and at least 32 characters',
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
