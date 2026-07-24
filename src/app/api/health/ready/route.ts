import { withErrorHandling } from '@/lib/api/handler';
 

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getRedis } from '@/lib/rate-limit';
import type { ReadinessResponse, HealthStatus, HealthCheckResult } from '@atlas/core/observability';
import { headers } from 'next/headers';

async function GET_handler() {
  let requestId: string | undefined = undefined;
  try {
     
    const h = await headers();
    if (h && typeof h.get === 'function') {
      requestId = h.get('x-request-id') || undefined;
    }
  } catch {}

  const checks: Record<string, HealthCheckResult> = {};
  let overallStatus: HealthStatus = 'healthy';

  // Check Database
  const startDb = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startDb,
    };
  } catch {
    checks.database = {
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startDb,
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis (if configured)
  const redis = getRedis();
  if (redis) {
    const startRedis = Date.now();
    try {
      await redis.ping();
      checks.redis = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startRedis,
      };
    } catch {
      checks.redis = {
        status: 'degraded',
        message: 'Redis ping failed',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startRedis,
      };
      // Rate limiting Redis is not considered fatal for App readiness, mark as degraded
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }
  } else {
    checks.redis = {
      status: 'degraded',
      message: 'Redis is not configured',
      timestamp: new Date().toISOString(),
    };
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  const response: ReadinessResponse = {
    service: 'atlas-app',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    checks,
  };

  return NextResponse.json(response, { 
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: requestId ? { 'x-request-id': requestId } : undefined
  });
}

export const GET = withErrorHandling(GET_handler, 'GET /api/health/ready');
