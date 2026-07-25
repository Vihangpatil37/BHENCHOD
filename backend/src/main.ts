import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for dev, or specify frontend URL
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

  // Validate provider API keys at startup — log loudly, never block
  const primaryProviders = ['GEMINI', 'GROQ', 'MISTRAL'];
  for (const provider of primaryProviders) {
    const keys = process.env[`${provider}_API_KEYS`];
    if (!keys || keys.trim().length === 0) {
      console.warn(
        `\n⚠️  WARNING: ${provider}_API_KEYS is missing or empty. ${provider} is a primary provider in the routing table.\n`,
      );
    }
  }
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend server is running on: http://localhost:${port}/api`);
}
bootstrap();
