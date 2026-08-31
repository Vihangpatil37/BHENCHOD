import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly queueService: QueueService) {}

  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    const status = await this.queueService.getJobStatus(id);
    if (!status) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return status;
  }
}
