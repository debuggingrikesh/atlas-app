import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * GET /api/business/[businessId]/audit-events
 * Returns audit events for a business.
 * Requires ADMIN or OWNER role (business.read_audit or similar permission if defined, we'll use business.read for now, or check for admin role).
 */
export async function GET(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;

  // Let's require 'business.update' as a proxy for admin privileges if there isn't an explicit audit read permission.
  // We can use PERMISSIONS.business.update because only owners/admins have it by default.
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.update);
  if (memberError) return memberError;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor') || undefined;

    const events = await prisma.auditEvent.findMany({
      where: { businessId },
      orderBy: { occurredAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    let nextCursor: string | undefined = undefined;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem?.id;
    }

    return successResponse({ events, nextCursor });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[business/:id/audit-events GET] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
