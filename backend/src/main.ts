import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizationInterceptor } from './common/interceptors/sanitization.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Suppress dotenv injected env (0) logs which are verbose and unnecessary
process.env.DOTENV_CONFIG_QUIET = 'true';

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

  // Register global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new SanitizationInterceptor(),
  );

  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

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
  if (!process.env.DB_ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY.length < 64) {
    throw new Error('DB_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
