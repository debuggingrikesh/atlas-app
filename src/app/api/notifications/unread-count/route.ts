import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { getUnreadCount } from '@/modules/notifications/lib/get-unread-count';
import { successResponse, errorResponse } from '@/lib/api/response';

async function GET_handler(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') ?? undefined;

    const count = await getUnreadCount(user.id, businessId);
    return successResponse({ count });
  } catch (error) {
    logger.error({ message: 'API Error', context: '[unread-count GET]', route: 'API' }, error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch unread count', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/notifications/unread-count');
