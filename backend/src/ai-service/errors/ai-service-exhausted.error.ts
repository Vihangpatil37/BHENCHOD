import { HttpException, HttpStatus } from '@nestjs/common';
import { AttemptRecord } from '../types/retry.types';

export class AIServiceExhaustedError extends HttpException {
  constructor(
    public readonly traceId: string,
    public readonly task: string,
    public readonly totalAttempts: number,
    public readonly history: AttemptRecord[],
    message: string = 'AI Service failed. All configured LLM providers and key attempts were exhausted.',
  ) {
    super(
      {
        message,
        traceId,
        task,
        totalAttempts,
        history,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
