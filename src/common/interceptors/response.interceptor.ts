import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppLoggerService } from '../logging/app-logger.service';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, { success: true; data: T }>
{
  constructor(private readonly logger: AppLoggerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; data: T }> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          'HTTP request completed',
          ResponseInterceptor.name,
          {
            method: request.method,
            url: request.originalUrl ?? request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            ip: request.ip,
            userAgent: request.get('user-agent'),
          },
        );
      }),
      map((data: T) => ({
        success: true as const,
        data,
      })),
    );
  }
}