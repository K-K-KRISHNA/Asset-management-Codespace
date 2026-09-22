import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { currentTraceId } from './trace-context';

type LogMeta = Record<string, unknown>;

@Injectable()
export class AppLoggerService implements NestLogger {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const logLevel =
      this.configService.get<string>('LOG_LEVEL') ?? 'info';

    const serviceName =
      this.configService.get<string>('SERVICE_NAME') ?? 'app';

    const environment =
      this.configService.get<string>('ENVIRONMENT') ?? 'dev';

    this.logger = winston.createLogger({
      level: logLevel,
      defaultMeta: {
        service: serviceName,
        environment,
      },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  log(
  message: unknown,
  context?: string,
  meta?: LogMeta,
): void {
  this.logger.info(
    this.createLogEntry(message, context, undefined, meta),
  );
  }

  error(
    message: unknown,
    trace?: string,
    context?: string,
    meta?: LogMeta,
  ): void {
    this.logger.error(
      this.createLogEntry(message, context, trace, meta),
    );
  }

  warn(
    message: unknown,
    context?: string,
    meta?: LogMeta,
  ): void {
    this.logger.warn(
      this.createLogEntry(message, context, undefined, meta),
    );
  }

  debug(
    message: unknown,
    context?: string,
    meta?: LogMeta,
  ): void {
    this.logger.debug(
      this.createLogEntry(message, context, undefined, meta),
    );
  }

  verbose(
    message: unknown,
    context?: string,
    meta?: LogMeta,
  ): void {
    this.logger.verbose(
      this.createLogEntry(message, context, undefined, meta),
    );
  }

  private createLogEntry(
    message: unknown,
    context?: string,
    stack?: string,
    meta?: LogMeta,
  ): LogMeta {
    return {
      ...meta,
      message,
      traceId: currentTraceId(),
      context,
      ...(stack && { stack }),
    };
  }
}