/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  let requestId: string | undefined = undefined;
  try {
     
    const h = headers() as any;
    if (h && typeof h.get === 'function') {
      requestId = h.get('x-request-id') || undefined;
    }
  } catch {}

  return NextResponse.json(
    {
      success: true,
      data,
    },
    { 
      status,
      headers: requestId ? { 'x-request-id': requestId } : undefined
    }
  );
}

import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  explicitRequestId?: string
): NextResponse<ApiErrorResponse> {
  let requestId = explicitRequestId;
  
  if (!requestId) {
    try {
       
      const h = headers() as any;
      if (h && typeof h.get === 'function') {
        requestId = h.get('x-request-id') || undefined;
      }
    } catch {}
  }

  // Global Error Logging for 5xx errors or explicit exceptions
  if (status >= 500) {
    logger.error({
      message: `API Error [${code}]`,
      code,
      errorMessage: message,
      status,
      requestId,
    });
  } else {
    logger.warn({
      message: `API Warning [${code}]`,
      code,
      errorMessage: message,
      status,
      requestId,
    });
  }

  // Hide internal error details in production for 500s
  const isProduction = process.env.NODE_ENV === 'production';
  const publicMessage = (status >= 500 && isProduction) 
    ? 'An unexpected error occurred. Please try again later.'
    : message;

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: publicMessage,
        ...(requestId ? { requestId } : {})
      },
    },
    { 
      status,
      headers: requestId ? { 'x-request-id': requestId } : undefined
    }
  );
}
