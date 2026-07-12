import { Controller, Get, Query, Request } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getHistory(
    @Request() req: any,
    @Query('type') type = 'all',
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.historyService.getHistory(req.user.user_id, type, pageNum, limitNum);
  }
}
