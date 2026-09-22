import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    traceId: string;
    userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentTraceId(): string | undefined {
    return requestContext.getStore()?.traceId;
}