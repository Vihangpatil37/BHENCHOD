import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  private readonly SENSITIVE_KEYS = [
    'password',
    'password_hash',
    'two_factor_secret',
    'recovery_codes',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.sanitize(data);
      }),
    );
  }

  private sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // If it's an array, map over it
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // If it's an object, sanitize its keys
    if (typeof data === 'object' && !(data instanceof Date)) {
      // Handle mongoose documents safely
      const rawData = typeof data.toJSON === 'function' ? data.toJSON() : data;
      
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawData)) {
        if (this.SENSITIVE_KEYS.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }

    return data;
  }
}
