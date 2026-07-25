import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIRequestLog } from './ai-request-log.schema';

@Injectable()
export class TokenLoggerService {
  private readonly logger = new Logger(TokenLoggerService.name);

  constructor(
    @InjectModel(AIRequestLog.name)
    private readonly logModel: Model<AIRequestLog>,
  ) {}

  async log(logData: {
    task_type: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    success: boolean;
    fallback_used: boolean;
    cached: boolean;
  }): Promise<void> {
    try {
      const log = new this.logModel(logData);
      await log.save();
      this.logger.debug(
        `Logged AI call for ${logData.task_type} via ${logData.provider} (${logData.model}) - success: ${logData.success}, latency: ${logData.latency_ms}ms`,
      );
    } catch (e: any) {
      // Non-negotiable rule: "Analytics must never throw" / logging errors shouldn't crash requests
      this.logger.error(`Failed to save AI log: ${e.message}`);
    }
  }
}
