import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || res.error || exception.message;
      
      if (status === HttpStatus.UNAUTHORIZED) {
        errorCode = 'AUTH_EXPIRED';
      } else if (status === HttpStatus.FORBIDDEN) {
        errorCode = 'FORBIDDEN';
      } else if (status === HttpStatus.BAD_REQUEST) {
        errorCode = 'VALIDATION_ERROR';
        details = res.message;
      } else {
        errorCode = res.errorCode || 'HTTP_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (exception.name === 'AIServiceExhaustedError') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        errorCode = 'AI_UNAVAILABLE';
        details = (exception as any).history;
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - ErrorCode: ${errorCode} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      errorCode,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      details,
    });
  }
}
