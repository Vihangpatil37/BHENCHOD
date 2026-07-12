import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
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
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    // Generate or retrieve request ID
    if (!request.requestId) {
      request.requestId = request.headers['x-request-id'] || randomUUID().replace(/-/g, '');
    }
    const requestId = request.requestId;

    return next.handle().pipe(
      map((data) => ({
        data: data === undefined ? null : data,
        timestamp: new Date().toISOString(),
        requestId,
      })),
    );
  }
}
