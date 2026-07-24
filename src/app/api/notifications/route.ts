import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { getNotifications } from '@/modules/notifications/lib/get-notifications';
import { notificationPaginationSchema } from '@/modules/notifications/validators';
import { successResponse, errorResponse } from '@/lib/api/response';

async function GET_handler(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const { searchParams } = new URL(request.url);
    const queryData = {
      businessId: searchParams.get('businessId') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const result = notificationPaginationSchema.safeParse(queryData);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid query', 400);
    }

    const { businessId, cursor, limit } = result.data;

    const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.business.read);
    if (permError) return permError;

    const { items, nextCursor } = await getNotifications(user.id, businessId, {
      cursor,
      limit,
    });

    return successResponse({ items, nextCursor });
  } catch (error) {
    logger.error({ message: 'API Error', context: '[notifications GET]', route: 'API' }, error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/notifications');
