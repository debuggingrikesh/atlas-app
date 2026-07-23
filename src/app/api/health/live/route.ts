/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import type { LivenessResponse } from '@atlas/core/observability';

export async function GET() {
  const response: LivenessResponse = {
    service: 'atlas-app',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response);
}
