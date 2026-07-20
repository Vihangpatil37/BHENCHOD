import {
  Controller,
  Post,
  Get,
  Param,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Request() req: any) {
    return this.reportsService.startReportGeneration(req.user.user_id);
  }

  @Get('status/:reportId')
  async getStatus(@Request() req: any, @Param('reportId') reportId: string) {
    return this.reportsService.getReportStatus(req.user.user_id, reportId);
  }

  @Get('download/:reportId')
  async download(@Request() req: any, @Param('reportId') reportId: string, @Res() res: Response) {
    const stream = await this.reportsService.getReportDownloadStream(req.user.user_id, reportId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="career_report_${reportId}.pdf"`,
    });
    stream.pipe(res);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.reportsService.getReportsHistory(req.user.user_id);
  }
}
