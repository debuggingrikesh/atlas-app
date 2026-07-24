import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { markNotificationRead } from '@/modules/notifications/lib/mark-notification-read';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ id: string }>;
}

async function PATCH_handler(request: Request, { params }: Params) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const { id } = await params;
    await markNotificationRead(user.id, id);
    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Notification not found') {
        return errorResponse('NOT_FOUND', error.message, 404);
      }
      if (error.message.startsWith('Unauthorized')) {
        return errorResponse('UNAUTHORIZED', error.message, 403);
      }
    }
    logger.error({ message: 'API Error', context: '[mark-read PATCH]', route: 'API' }, error);
    return errorResponse('INTERNAL_ERROR', 'Failed to mark notification as read', 500);
  }
}

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/notifications/[id]/read');
