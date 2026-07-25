import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

export interface Response<T> {
  data: T;
  timestamp: string;
  requestId: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | StreamableFile
> {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    if (!request.requestId) {
      request.requestId =
        request.headers['x-request-id'] || randomUUID().replace(/-/g, '');
    }
    const requestId = request.requestId;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) return data;
        return {
          data: data === undefined ? null : data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
