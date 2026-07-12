import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { FeedbackDto } from './dto/recommendation.dto';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Request() req: any) {
    return this.recommendationService.generateRecommendation(req.user.user_id);
  }

  @Get('latest')
  async getLatest(@Request() req: any) {
    return this.recommendationService.getLatestRecommendation(req.user.user_id);
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerate(@Request() req: any) {
    return this.recommendationService.regenerate(req.user.user_id);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async feedback(@Request() req: any, @Body() dto: FeedbackDto) {
    return this.recommendationService.submitFeedback(req.user.user_id, dto);
  }
}
