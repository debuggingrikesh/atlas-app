import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import { verifyInternalRequest } from '@/lib/auth/internal';

export async function GET(request: Request) {
  if (!(await verifyInternalRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const businessId = searchParams.get('businessId') || undefined;
  const action = searchParams.get('action') || undefined;
  const resourceType = searchParams.get('resourceType') || undefined;
  const actorUserId = searchParams.get('actorUserId') || undefined;

  try {
    const events = await prisma.auditEvent.findMany({
      where: {
        ...(businessId && { businessId }),
        ...(action && { action }),
        ...(resourceType && { resourceType }),
        ...(actorUserId && { actorUserId }),
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[Internal Audit API] Error fetching audit events', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
