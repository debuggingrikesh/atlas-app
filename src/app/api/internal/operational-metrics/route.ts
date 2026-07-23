import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyInternalRequest } from '@/lib/auth/internal';
import { metrics } from '@/lib/metrics';

export async function GET(request: Request) {
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

  try {
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
  } catch (error) {
    console.error('[Internal Metrics API] Error fetching operational metrics', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { metric, value, opts } = body;
    
    if (metric && typeof value === 'number') {
      metrics.observe(metric, value, opts || {});
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const retentionDays = parseInt(process.env.METRICS_RETENTION_DAYS || '14', 10);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const deleted = await prisma.operationalMetric.deleteMany({
      where: {
        bucketStartedAt: { lt: cutoff }
      }
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error) {
    console.error('[Internal Metrics API] Error cleaning up operational metrics', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

