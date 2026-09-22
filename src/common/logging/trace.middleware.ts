import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { requestContext } from './trace-context';

type TracedRequest = Request & {
  traceId?: string;
  requestId?: string;
};

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(
    req: TracedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    const incoming =
      req.header('X-Trace-Id') ||
      req.header('X-Request-Id');

    const traceId = incoming?.trim() || randomUUID();

    req.traceId = traceId;
    req.requestId = traceId;

    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Id', traceId);

    requestContext.run({ traceId }, next);
  }
}