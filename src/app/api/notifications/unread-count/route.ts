 

import { requireAuth } from '@/lib/auth/require-auth';
import { getUnreadCount } from '@/modules/notifications/lib/get-unread-count';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') ?? undefined;

    const count = await getUnreadCount(user.id, businessId);
    return successResponse({ count });
  } catch (error) {
    console.error('[unread-count GET]', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch unread count', 500);
  }
}
