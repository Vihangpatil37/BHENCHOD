import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { StudentProfile, StudentProfileDocument } from '../onboarding/schemas/student-profile.schema';
import { Recommendation, RecommendationDocument } from '../recommendation/schemas/recommendation.schema';
import * as fs from 'fs';
import * as path from 'path';

// Load pdfmake with standard PostScript fonts to avoid downloading font files
const pdfmake = require('pdfmake');

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly reportsDir = path.join(process.cwd(), 'reports_output');

  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(StudentProfile.name) private readonly profileModel: Model<StudentProfileDocument>,
    @InjectModel(Recommendation.name) private readonly recommendationModel: Model<RecommendationDocument>,
  ) {
    // Ensure output directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async startReportGeneration(userId: string): Promise<Report> {
    this.logger.log(`Starting report generation request for user: ${userId}`);

    // Fetch student profile & recommendations
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

    // Create Report Document
    const report = new this.reportModel({
      user_id: userId,
      recommendation_ref: String(recommendation._id),
      status: 'QUEUED',
    });
    await report.save();

    // Trigger PDF generation asynchronously
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

      pdfmake.fonts = fonts;

      const dna = profile.current_dna!;
      const finalRecs = recommendation.final_recommendations || [];

      // Build document content
      const docDefinition: any = {
        content: [
          { text: 'SCPR Career Recommendation Report', style: 'header' },
          { text: `Generated for: ${profile.personal?.name || 'Student'}`, style: 'subheader' },
          { text: `Date: ${new Date().toLocaleDateString()}`, style: 'meta' },
          { text: '\n' },

          { text: 'Your Traits & DNA Analysis', style: 'sectionHeader' },
          { text: 'Here are your scores across the 10 core dimensions:', style: 'body' },
          {
            ul: [
              `Analytical Thinking: ${dna.analytical_thinking}/100`,
              `Creativity: ${dna.creativity}/100`,
              `Communication: ${dna.communication}/100`,
              `Leadership: ${dna.leadership}/100`,
              `Research: ${dna.research}/100`,
              `Business Acumen: ${dna.business_acumen}/100`,
              `Technical Curiosity: ${dna.technical_curiosity}/100`,
              `Empathy: ${dna.empathy}/100`,
              `Patience: ${dna.patience}/100`,
              `Risk Tolerance: ${dna.risk_tolerance}/100`,
            ],
            style: 'body',
          },
          { text: '\n' },

          { text: 'Top Career Matches', style: 'sectionHeader' },
          ...finalRecs.map((rec) => [
            { text: `\n${rec.rank}. ${rec.career_code.replace('_', ' ').toUpperCase()}`, style: 'careerTitle' },
            { text: `Match Score: ${rec.ai_score}%`, style: 'careerScore' },
            { text: `Explanation: ${rec.explanation}`, style: 'body' },
            { text: `Roadmap: ${rec.roadmap}`, style: 'body' },
            { text: `Suggested Colleges: ${rec.suggested_colleges?.join(', ') || 'N/A'}`, style: 'body' },
            { text: `Suggested Certifications: ${rec.suggested_certifications?.join(', ') || 'N/A'}`, style: 'body' },
          ]),
        ],
        defaultStyle: {
          font: 'Helvetica',
        },
        styles: {
          header: { fontSize: 24, bold: true, alignment: 'center' },
          subheader: { fontSize: 16, italics: true, alignment: 'center' },
          meta: { fontSize: 10, alignment: 'center', color: '#666' },
          sectionHeader: { fontSize: 18, bold: true, color: '#2b6cb0', marginTop: 15 },
          careerTitle: { fontSize: 14, bold: true },
          careerScore: { fontSize: 11, bold: true, color: '#e53e3e' },
          body: { fontSize: 10, marginTop: 5, color: '#333' },
        },
      };

      const filename = `report_${report._id}.pdf`;
      const filePath = path.join(this.reportsDir, filename);

      const pdfDoc = pdfmake.createPdf(docDefinition);
      await pdfDoc.write(filePath);

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

    if (report.status !== 'READY' || !report.file_ref || !fs.existsSync(report.file_ref)) {
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
