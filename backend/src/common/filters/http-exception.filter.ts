import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export interface FieldError {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    // Retrieve or generate request ID
    if (!request.requestId) {
      request.requestId =
        (request.headers['x-request-id'] as string) ||
        randomUUID().replace(/-/g, '');
    }
    const requestId = request.requestId;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let detail: string | undefined = undefined;
    let errors: FieldError[] | undefined = undefined;

    if (exception instanceof HttpException) {
      const resContent: any = exception.getResponse();
      if (typeof resContent === 'object' && resContent !== null) {
        message = resContent.message || exception.message;
        detail = resContent.error || undefined;

        // Handle class-validator validation errors (usually in message as array of strings)
        if (Array.isArray(resContent.message)) {
          message = 'Validation failed';
          errors = resContent.message.map((msg: string) => {
            const firstWord = msg.split(' ')[0] || 'field';
            return {
              field: firstWord,
              message: msg,
            };
          });
        }
      } else {
        message = exception.message || String(resContent);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // ponytail: never expose stack traces to client in prod/test
      detail =
        process.env.NODE_ENV === 'development'
          ? exception.stack
          : undefined;
    } else {
      message = String(exception);
    }

    // Support both camelCase and snake_case to be fully compliant with both spec rules
    const errorResponse = {
      statusCode: status,
      status_code: status,
      message,
      detail,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      request_id: requestId,
    };

    response.status(status).json(errorResponse);
  }
}
