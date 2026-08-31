import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agenda, Job } from 'agenda';
import { RecommendationService } from '../recommendation/recommendation.service';
import { CounselorService } from '../counselor/counselor.service';
import { Types } from 'mongoose';
import { MongoBackend } from '@agendajs/mongo-backend';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private agenda: Agenda;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => RecommendationService))
    private recommendationService: RecommendationService,
    @Inject(forwardRef(() => CounselorService))
    private counselorService: CounselorService,
  ) {
    const mongoUri = this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/scpr';
    this.agenda = new Agenda({ backend: new MongoBackend({ address: mongoUri, collection: 'agendaJobs' }) });
  }

  async onModuleInit() {
    this.defineJobs();
    await this.agenda.start();
    console.log('Agenda queue started');
  }

  async onModuleDestroy() {
    await this.agenda.stop();
  }

  private defineJobs() {
    this.agenda.define('generate-recommendation', async (job: Job) => {
      const { userId } = (job.attrs.data as any) || {};
      const result = await this.recommendationService.generateRecommendation(userId);
      (job.attrs.data as any).result = result;
    });

    this.agenda.define('regenerate-recommendation', async (job: Job) => {
      const { userId } = (job.attrs.data as any) || {};
      const result = await this.recommendationService.regenerate(userId);
      (job.attrs.data as any).result = result;
    });

    this.agenda.define('counselor-chat', async (job: Job) => {
      const { userId, sessionId, message } = (job.attrs.data as any) || {};
      const result = await this.counselorService.sendMessage(userId, sessionId, message);
      (job.attrs.data as any).result = result;
    });
  }

  async enqueueRecommendationGeneration(userId: string) {
    const existingJobs = await (this.agenda.db as any).collection.find({
      name: 'generate-recommendation',
      'data.userId': userId,
      lastFinishedAt: null,
    }).toArray();
    if (existingJobs && existingJobs.length > 0) {
      return existingJobs[0]._id!.toString();
    }
    
    const job = this.agenda.create('generate-recommendation', { userId });
    job.schedule('now');
    await job.save();
    return job.attrs._id!.toString();
  }

  async enqueueRecommendationRegeneration(userId: string) {
    const existingJobs = await (this.agenda.db as any).collection.find({
      name: 'regenerate-recommendation',
      'data.userId': userId,
      lastFinishedAt: null,
    }).toArray();
    if (existingJobs && existingJobs.length > 0) {
      return existingJobs[0]._id!.toString();
    }

    const job = this.agenda.create('regenerate-recommendation', { userId });
    job.schedule('now');
    await job.save();
    return job.attrs._id!.toString();
  }

  async enqueueCounselorChat(userId: string, sessionId: string, message: string) {
    const job = await this.agenda.now('counselor-chat', { userId, sessionId, message });
    return job.attrs._id!.toString();
  }

  async getJobStatus(jobId: string) {
    try {
      let job;
      try {
        job = await this.agenda.db.getJobById(jobId);
      } catch (e) {
        return null;
      }

      if (!job) {
        return null;
      }
      
      const attrs = job;
      
      let status = 'pending';
      if (attrs.lockedAt) status = 'processing';
      if (attrs.lastFinishedAt) {
        status = attrs.failReason ? 'failed' : 'completed';
      }

      return {
        id: attrs._id,
        name: attrs.name,
        status,
        result: (attrs.data as any)?.result,
        error: attrs.failReason,
        createdAt: attrs.nextRunAt || attrs.lastRunAt,
        finishedAt: attrs.lastFinishedAt,
      };
    } catch (e) {
      console.error('getJobStatus ERROR:', e);
      throw e;
    }
  }
}
