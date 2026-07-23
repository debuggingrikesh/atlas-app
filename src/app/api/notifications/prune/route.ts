import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { pruneNotifications } from '@/modules/notifications/lib/prune-notifications';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/notifications/prune
 * Prunes read notifications older than 30 days.
 */
export async function POST() {
  const { errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const { count } = await pruneNotifications();
    return successResponse({ count });
  } catch (error) {
    logger.error({ message: 'API Error', context: '[notifications prune POST]', route: 'API' }, error);
    return errorResponse('INTERNAL_ERROR', 'Failed to prune notifications', 500);
  }
}
