import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { pruneNotifications } from '@/modules/notifications/lib/prune-notifications';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/notifications/prune
 * Prunes read notifications older than 30 days.
 */
async function POST_handler() {
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

export const POST = withErrorHandling(POST_handler, 'POST /api/notifications/prune');
