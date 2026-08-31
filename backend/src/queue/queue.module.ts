import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobsController } from './jobs.controller';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { CounselorModule } from '../counselor/counselor.module';

@Module({
  imports: [
    forwardRef(() => RecommendationModule),
    forwardRef(() => CounselorModule),
  ],
  providers: [QueueService],
  controllers: [JobsController],
  exports: [QueueService],
})
export class QueueModule {}
