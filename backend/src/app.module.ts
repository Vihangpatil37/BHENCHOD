import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { AIServiceModule } from './ai-service/ai-service.module';
import { CareersModule } from './careers/careers.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { CounselorModule } from './counselor/counselor.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HistoryModule } from './history/history.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60000, limit: 20 },
      { name: 'default', ttl: 60000, limit: 100 },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/scpr',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HealthModule,
    AIServiceModule,
    CareersModule,
    OnboardingModule,
    RecommendationModule,
    CounselorModule,
    DashboardModule,
    AnalyticsModule,
    HistoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
