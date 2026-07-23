import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/api/handler';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyInternalRequest } from '@/lib/auth/internal';
import { metrics } from '@/lib/metrics';

export const GET = withErrorHandling(async function GET(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const metric = searchParams.get('metric');
  const hours = parseInt(searchParams.get('hours') || '24', 10);

  if (hours > 168) { // max 7 days
    return NextResponse.json({ error: 'Max time range is 7 days' }, { status: 400 });
  }

  const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const data = await prisma.operationalMetric.findMany({
    where: {
      ...(service && { service }),
      ...(metric && { metric }),
      bucketStartedAt: { gte: fromTime }
    },
    orderBy: { bucketStartedAt: 'asc' },
    take: 1000,
  });

  return NextResponse.json({ data });
}, 'GET /api/internal/operational-metrics');

export const POST = withErrorHandling(async function POST(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { metric, value, opts } = body;

  if (metric && typeof value === 'number') {
    metrics.observe(metric, value, opts || {});
  } else {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}, 'POST /api/internal/operational-metrics');

export const DELETE = withErrorHandling(async function DELETE(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const retentionDays = parseInt(process.env.METRICS_RETENTION_DAYS || '14', 10);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const deleted = await prisma.operationalMetric.deleteMany({
    where: {
      bucketStartedAt: { lt: cutoff }
    }
  });

  return NextResponse.json({ success: true, count: deleted.count });
}, 'DELETE /api/internal/operational-metrics');
