import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { currentTraceId } from './trace-context';
import DailyRotateFile from 'winston-daily-rotate-file';
import { maskPii } from './pii-masker';

type LogMeta = Record<string, unknown>;

@Injectable()
export class AppLoggerService implements NestLogger {
  private readonly logger: winston.Logger;
  private readonly piiMaskEnabled:boolean;

  constructor(private readonly configService: ConfigService) {
    const logLevel =
      this.configService.get<string>('LOG_LEVEL') ?? 'info';

    const serviceName =
      this.configService.get<string>('SERVICE_NAME') ?? 'app';

    const environment =
      this.configService.get<string>('ENVIRONMENT') ?? 'dev';

    this.piiMaskEnabled =
      this.configService.get<boolean>('PII_MASKING_ENABLED') ?? true;

    const transports = this.createTransports();

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
      transports
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
    const logEntry:LogMeta = {
      ...meta,
      message,
      traceId: currentTraceId(),
      context,
      ...(stack && { stack }),
    };
    return maskPii(logEntry, this.piiMaskEnabled) as LogMeta
  }

  private createTransports(): winston.transport[] {
    const configuredTransports = this.configService.get<string>('LOG_TRANSPORTS') ?? 'console';

    const transports: winston.transport[] = []

    const enabledTransports = configuredTransports.split(',').map((transport) => transport.trim().toLocaleLowerCase()).filter(Boolean);

    if (enabledTransports.includes('console')) {
      transports.push(new winston.transports.Console());
    }

    if (enabledTransports.includes('file')) {
      transports.push(
        new DailyRotateFile({
          filename: this.configService.get<string>('LOG_FILE_PATH') ?? './logs/my-api-%DATE%.log',
          datePattern:
            this.configService.get<string>(
              'LOG_FILE_ROTATE_FREQUENCY',
            ) ?? 'YYYY-MM-DD',
          maxSize: this.configService.get<string>('LOG_FILE_MAX_SIZE') ?? '20m',
          maxFiles: this.configService.get<string>('LOG_FILE_MAX_TIME') ?? '14d'
        })
      )
    }
    return transports
  }
}