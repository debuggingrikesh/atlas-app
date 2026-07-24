import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { getActivityFeed } from '@/modules/activity/lib/get-activity-feed';
import { successResponse, errorResponse } from '@/lib/api/response';
import { safeParse } from '@atlas/core/validation';
import { CursorPaginationSchema } from '@atlas/core/domain';
import type { PageInfo } from '@atlas/core/domain';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * GET /api/business/[businessId]/activity
 */
async function GET_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.activity.read);
  if (permError) return permError;

  try {
    const { searchParams } = new URL(request.url);
    const queryData = {
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined,
    };

    const result = safeParse(CursorPaginationSchema, queryData);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.issues[0]?.message ?? 'Invalid query parameters.', 400);
    }

    const { items, nextCursor } = await getActivityFeed(businessId, {
      cursor: result.data.cursor,
      limit: result.data.limit,
    });

    // Explicit mapping to Core pagination response metadata internally
    const pageInfo: PageInfo = {
      hasNextPage: !!nextCursor,
      hasPreviousPage: !!result.data.cursor,
      endCursor: nextCursor,
    };

    // Safest correction: Preserve the existing response payload exactly
    return successResponse({
      items,
      nextCursor: pageInfo.endCursor,
    });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[activity GET] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch activity feed.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/business/[businessId]/activity');
