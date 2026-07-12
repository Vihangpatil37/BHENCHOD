import {
  Controller,
  Post,
  Get,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  StreamableFile,
  Header,
} from '@nestjs/common';
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
  @Header('Content-Type', 'application/pdf')
  async download(@Request() req: any, @Param('reportId') reportId: string) {
    const stream = await this.reportsService.getReportDownloadStream(req.user.user_id, reportId);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename="career_report_${reportId}.pdf"`,
    });
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.reportsService.getReportsHistory(req.user.user_id);
  }
}
