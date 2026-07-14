import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { getActivityFeed } from '@/modules/activity/lib/get-activity-feed';
import { activityFeedQuerySchema } from '@/modules/activity/validators';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * GET /api/business/[businessId]/activity
 */
export async function GET(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.activity.read);
  if (permError) return permError;

  try {
    const { searchParams } = new URL(request.url);
    const queryData = {
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const result = activityFeedQuerySchema.safeParse(queryData);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid query parameters.', 400);
    }

    const { items, nextCursor } = await getActivityFeed(businessId, {
      cursor: result.data.cursor,
      limit: result.data.limit,
    });

    return successResponse({ items, nextCursor });
  } catch (err) {
    console.error('[activity GET] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch activity feed.', 500);
  }
}
