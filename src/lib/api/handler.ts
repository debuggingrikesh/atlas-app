import { NextResponse } from 'next/server';
import { logger } from '../logger';
import { normalizeError, safeErrorResponse } from '../errors';
import crypto from 'crypto';

type RouteHandler = (request: Request, context: unknown) => Promise<Response> | Response;

const REQUEST_ID_REGEX = /^[A-Za-z0-9._-]{1,64}$/;

export function resolveRequestId(incomingId: string | null): string {
  if (incomingId && REQUEST_ID_REGEX.test(incomingId)) {
    return incomingId;
  }
  return crypto.randomUUID();
}

export function withErrorHandling(handler: RouteHandler, routeName: string): RouteHandler {
  return async (request: Request, context: unknown) => {
    // 1. Request correlation
    const incomingId = request.headers.get('x-request-id');
    const requestId = resolveRequestId(incomingId);

    try {
      // Execute the handler
      const response = await handler(request, context);
      
      // Clone response to inject headers without mutating the original immutable Response
      const newHeaders = new Headers(response.headers);
      newHeaders.set('x-request-id', requestId);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      
      logger.error({ 
        message: 'API Request Failed', 
        route: routeName, 
        requestId,
        code: normalizedError.code,
        status: normalizedError.status,
      }, err instanceof Error ? err : new Error(String(err)));

      // Return a safe JSON response
      const safeResponse = safeErrorResponse(normalizedError);
      
      return NextResponse.json(safeResponse, { 
        status: normalizedError.status,
        headers: { 'x-request-id': requestId }
      });
    }
  };
}
