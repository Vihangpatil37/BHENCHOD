import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me')
  async getMyAnalytics(@Request() req: any) {
    return this.analyticsService.getUserEvents(req.user.user_id);
  }

  @Roles('admin')
  @Get('platform')
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Roles('admin')
  @Get('careers')
  async getCareersStats() {
    return this.analyticsService.getCareersStats();
  }

  @Roles('admin')
  @Get('ai')
  async getAIStats() {
    return this.analyticsService.getAIStats();
  }

  // Allowed event types to prevent pollution
  private static readonly ALLOWED_EVENT_TYPES = new Set([
    'ONBOARDING_STEP_COMPLETED',
    'ONBOARDING_COMPLETED',
    'PROFILE_UPDATED',
    'RECOMMENDATION_VIEWED',
    'CAREER_SAVED',
    'CAREER_UNSAVED',
    'CHAT_SESSION_STARTED',
  ]);

  @Post('event')
  @HttpCode(HttpStatus.OK)
  async logCustomEvent(
    @Request() req: any,
    @Body() body: { event_type: string; payload: Record<string, any> },
  ) {
    if (!AnalyticsController.ALLOWED_EVENT_TYPES.has(body.event_type)) {
      return { success: true };
    }
    const userId = req.user?.user_id;
    await this.analyticsService.trackEvent(
      userId,
      body.event_type,
      body.payload,
    );
    return { success: true };
  }
}
