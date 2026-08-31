import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiHealth } from './schemas/ai-health.schema';

@Injectable()
export class AiHealthService {
  private readonly logger = new Logger(AiHealthService.name);

  constructor(@InjectModel(AiHealth.name) private aiHealthModel: Model<AiHealth>) {}

  async markHealthy(provider: string, apiKeyPrefix: string) {
    await this.aiHealthModel.findOneAndUpdate(
      { provider, apiKeyPrefix },
      { 
        $set: { status: 'healthy', errorCount: 0 },
        $unset: { cooldownUntil: 1, lastError: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async markRateLimited(provider: string, apiKeyPrefix: string, cooldownMinutes: number = 15) {
    const cooldownUntil = new Date(Date.now() + cooldownMinutes * 60000);
    this.logger.warn(`Marking ${provider} (key: ${apiKeyPrefix}) as rate-limited until ${cooldownUntil}`);
    await this.aiHealthModel.findOneAndUpdate(
      { provider, apiKeyPrefix },
      { 
        $set: { status: 'rate_limited', cooldownUntil },
        $inc: { errorCount: 1 }
      },
      { upsert: true }
    );
  }

  async markInvalid(provider: string, apiKeyPrefix: string, error: string) {
    this.logger.error(`Marking ${provider} (key: ${apiKeyPrefix}) as invalid: ${error}`);
    await this.aiHealthModel.findOneAndUpdate(
      { provider, apiKeyPrefix },
      { 
        $set: { status: 'invalid', lastError: error },
        $inc: { errorCount: 1 }
      },
      { upsert: true }
    );
  }

  async isHealthy(provider: string, apiKeyPrefix: string): Promise<boolean> {
    const health = await this.aiHealthModel.findOne({ provider, apiKeyPrefix });
    if (!health) return true; // Default to healthy if no record

    if (health.status === 'invalid' || health.status === 'disabled') {
      return false;
    }

    if (health.status === 'rate_limited') {
      if (health.cooldownUntil && health.cooldownUntil > new Date()) {
        return false; // Still cooling down
      } else {
        // Cooldown passed, we can try again. We don't mark healthy until it actually succeeds.
        return true;
      }
    }

    return true;
  }

  async getAllHealthStates(): Promise<AiHealth[]> {
    return this.aiHealthModel.find({}).exec();
  }
}
