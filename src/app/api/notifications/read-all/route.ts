import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { markAllNotificationsReadSchema } from '@/modules/notifications/validators';
import { markAllNotificationsRead } from '@/modules/notifications/lib/mark-all-notifications-read';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function PATCH(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const body = await request.json();
    const result = markAllNotificationsReadSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid request body', 400);
    }

    const { businessId } = result.data;

    // Check if the user is authorized to read notifications in this business
    const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.business.read);
    if (permError) return permError;

    const { count } = await markAllNotificationsRead(user.id, businessId);

    return successResponse({ count });
  } catch (error) {
    console.error('[notifications read-all PATCH]', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to mark notifications as read', 500);
  }
}
