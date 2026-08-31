import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { FeedbackDto } from './dto/recommendation.dto';
import { QueueService } from '../queue/queue.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Request() req: any) {
    const jobId = await this.queueService.enqueueRecommendationGeneration(req.user.user_id);
    return { jobId, message: 'Recommendation generation started' };
  }

  @Get('latest')
  async getLatest(@Request() req: any) {
    return this.recommendationService.getLatestRecommendation(req.user.user_id);
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  async regenerate(@Request() req: any) {
    const jobId = await this.queueService.enqueueRecommendationRegeneration(req.user.user_id);
    return { jobId, message: 'Recommendation regeneration started' };
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async feedback(@Request() req: any, @Body() dto: FeedbackDto) {
    return this.recommendationService.submitFeedback(req.user.user_id, dto);
  }
}
