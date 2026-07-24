import { withErrorHandling } from '@/lib/api/handler';
 

import { NextResponse } from 'next/server';
import type { LivenessResponse } from '@atlas/core';

async function GET_handler() {
  const response: LivenessResponse = {
    service: 'atlas-app',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response);
}

export const GET = withErrorHandling(GET_handler, 'GET /api/health/live');
