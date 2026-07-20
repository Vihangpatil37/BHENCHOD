import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { StudentProfile, StudentProfileDocument } from '../onboarding/schemas/student-profile.schema';
import { Recommendation, RecommendationDocument } from '../recommendation/schemas/recommendation.schema';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly reportsDir = path.join(process.cwd(), 'reports_output');

  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(StudentProfile.name) private readonly profileModel: Model<StudentProfileDocument>,
    @InjectModel(Recommendation.name) private readonly recommendationModel: Model<RecommendationDocument>,
  ) {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async startReportGeneration(userId: string): Promise<Report> {
    this.logger.log(`Starting report generation request for user: ${userId}`);

    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    const recommendation = await this.recommendationModel
      .findOne({ user_id: userId })
      .sort({ generated_at: -1 })
      .exec();

    if (!profile || !profile.current_dna) {
      throw new BadRequestException('Student profile or DNA not found. Onboarding must be completed first.');
    }
    if (!recommendation) {
      throw new BadRequestException('No recommendation found. Generate recommendations first.');
    }

    const report = new this.reportModel({
      user_id: userId,
      recommendation_ref: String(recommendation._id),
      status: 'QUEUED',
    });
    await report.save();

    this.generatePdfAsync(report, profile, recommendation);

    return report;
  }

  private async generatePdfAsync(
    report: ReportDocument,
    profile: StudentProfileDocument,
    recommendation: RecommendationDocument,
  ) {
    report.status = 'GENERATING';
    await report.save();

    try {
      this.logger.log(`Generating PDF for report ID: ${report._id}`);

      const html = this.buildReportHtml(profile, recommendation);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const filename = `report_${report._id}.pdf`;
      const filePath = path.join(this.reportsDir, filename);

      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

      await browser.close();

      report.status = 'READY';
      report.file_ref = filePath;
      await report.save();

      this.logger.log(`PDF report ready for download: ${filePath}`);
    } catch (err: any) {
      this.logger.error(`Failed to generate PDF for report ID ${report._id}: ${err.message}`);
      report.status = 'FAILED';
      await report.save();
    }
  }

  private buildReportHtml(
    profile: StudentProfileDocument,
    recommendation: RecommendationDocument,
  ): string {
    const dna = profile.current_dna!;
    const recs = recommendation.final_recommendations || [];

    const dnaDimensions = [
      { name: 'Analytical Thinking', score: dna.analytical_thinking },
      { name: 'Creativity', score: dna.creativity },
      { name: 'Communication', score: dna.communication },
      { name: 'Leadership', score: dna.leadership },
      { name: 'Research', score: dna.research },
      { name: 'Business Acumen', score: dna.business_acumen },
      { name: 'Technical Curiosity', score: dna.technical_curiosity },
      { name: 'Empathy', score: dna.empathy },
      { name: 'Patience', score: dna.patience },
      { name: 'Risk Tolerance', score: dna.risk_tolerance },
    ];

    const scoreColor = (s: number) =>
      s >= 70 ? '#38a169' : s >= 50 ? '#d69e2e' : '#e53e3e';

    const scoresHtml = dnaDimensions
      .map(
        (d) => `
      <div class="score-row">
        <span class="score-label">${d.name}</span>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width:${d.score}%;background:${scoreColor(d.score)}"></div>
        </div>
        <span class="score-value" style="color:${scoreColor(d.score)}">${d.score}</span>
      </div>`,
      )
      .join('');

    const recsHtml = recs
      .map(
        (r) => `
      <div class="career-card">
        <div class="career-header">
          <span class="career-rank">#${r.rank}</span>
          <span class="career-title">${r.career_code.replace(/_/g, ' ').toUpperCase()}</span>
          <span class="career-score">${r.ai_score}%</span>
        </div>
        <div class="career-body">
          <p><strong>Explanation:</strong> ${r.explanation}</p>
          <p><strong>Roadmap:</strong> ${r.roadmap}</p>
          ${r.suggested_colleges?.length ? `<p><strong>Colleges:</strong> ${r.suggested_colleges.join(', ')}</p>` : ''}
          ${r.suggested_certifications?.length ? `<p><strong>Certifications:</strong> ${r.suggested_certifications.join(', ')}</p>` : ''}
        </div>
      </div>`,
      )
      .join('');

    const studentName = profile.personal?.name || 'Student';
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a202c; line-height: 1.6; padding: 0; }
  .header { text-align: center; border-bottom: 3px solid #2b6cb0; padding-bottom: 18px; margin-bottom: 24px; }
  .header h1 { color: #2b6cb0; font-size: 26px; margin: 0 0 4px; }
  .header p { color: #718096; font-size: 12px; margin: 2px 0; }
  .section { margin: 24px 0; }
  .section h2 { color: #2b6cb0; font-size: 18px; border-left: 4px solid #2b6cb0; padding-left: 10px; margin: 0 0 14px; }
  .score-row { display: flex; align-items: center; margin: 6px 0; gap: 10px; }
  .score-label { width: 170px; font-size: 12px; font-weight: 600; color: #4a5568; text-align: right; }
  .score-bar-bg { flex: 1; height: 14px; background: #edf2f7; border-radius: 7px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 7px; transition: width 0.3s; }
  .score-value { width: 36px; font-size: 12px; font-weight: 700; text-align: right; }
  .career-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 12px 0; background: #f7fafc; }
  .career-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .career-rank { background: #2b6cb0; color: #fff; font-size: 12px; font-weight: 700; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; }
  .career-title { font-size: 16px; font-weight: 700; color: #2b6cb0; flex: 1; }
  .career-score { font-size: 14px; font-weight: 700; color: #e53e3e; }
  .career-body p { font-size: 11px; color: #4a5568; margin: 4px 0; }
  .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; }
</style>
</head>
<body>
  <div class="header">
    <h1>SCPR Career Recommendation Report</h1>
    <p>Generated for: ${studentName}</p>
    <p>${date}</p>
  </div>

  <div class="section">
    <h2>Your Traits &amp; DNA Analysis</h2>
    ${scoresHtml}
  </div>

  <div class="section">
    <h2>Top Career Matches</h2>
    ${recsHtml}
  </div>

  <div class="footer">
    SCPR — Smart Career Path Recommendation System &bull; Generated automatically
  </div>
</body>
</html>`;
  }

  async getReportStatus(userId: string, reportId: string): Promise<Report> {
    const report = await this.reportModel.findById(reportId).exec();
    if (!report || report.user_id !== userId) {
      throw new NotFoundException('Report not found or unauthorized');
    }
    return report;
  }

  async getReportDownloadStream(userId: string, reportId: string): Promise<fs.ReadStream> {
    const report = await this.reportModel.findById(reportId).exec();
    if (!report || report.user_id !== userId) {
      throw new NotFoundException('Report not found or unauthorized');
    }

    if (report.status !== 'READY' || !report.file_ref || !fs.existsSync(report.file_ref) || fs.statSync(report.file_ref).size === 0) {
      throw new BadRequestException('Report is not ready for download yet.');
    }

    report.status = 'DOWNLOADED';
    await report.save();

    return fs.createReadStream(report.file_ref);
  }

  async getReportsHistory(userId: string): Promise<Report[]> {
    return this.reportModel.find({ user_id: userId }).sort({ generated_at: -1 }).exec();
  }
}
