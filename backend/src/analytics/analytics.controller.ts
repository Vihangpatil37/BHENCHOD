import { Controller, Get, Post, Body, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me')
  async getMyAnalytics(@Request() req: any) {
    return this.analyticsService.getUserEvents(req.user.user_id);
  }

  @Get('platform')
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('careers')
  async getCareersStats() {
    return this.analyticsService.getCareersStats();
  }

  @Get('ai')
  async getAIStats() {
    return this.analyticsService.getAIStats();
  }

  @Post('event')
  @HttpCode(HttpStatus.OK)
  async logCustomEvent(
    @Request() req: any,
    @Body() body: { event_type: string; payload: Record<string, any> }
  ) {
    const userId = req.user?.user_id;
    await this.analyticsService.trackEvent(userId, body.event_type, body.payload);
    return { success: true };
  }
}
