/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { markNotificationRead } from '@/modules/notifications/lib/mark-notification-read';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
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
    console.error('[mark-read PATCH]', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to mark notification as read', 500);
  }
}
