import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { REPUTATION_PERMISSIONS } from '@/modules/reputation/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ReviewLifecycleService } from '@/modules/reputation/services/review-lifecycle-service';

interface Params {
  params: Promise<{ id: string }>;
}

async function PATCH_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.MANAGE);
  if (memberError) return memberError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (!['cancel', 'expire'].includes(action)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid action. Supported actions: cancel, expire', 400);
    }

    let updatedRequest;
    if (action === 'cancel') {
      updatedRequest = await ReviewLifecycleService.cancel(id, businessId, user.id);
    } else if (action === 'expire') {
      updatedRequest = await ReviewLifecycleService.expire(id, businessId, user.id);
    }

    return successResponse({ request: updatedRequest });
  } catch (err: unknown) {
    const error = err as { name?: string; code?: string; message?: string };
    if (error.name === 'AppError' && error.code === 'VALIDATION_ERROR') {
      return errorResponse('VALIDATION_ERROR', error.message || 'Validation error', 400);
    }
    if (error.name === 'AppError' && error.code === 'NOT_FOUND') {
      return errorResponse('NOT_FOUND', error.message || 'Not found', 404);
    }
    logger.error({ message: 'API Error', context: '[reputation/requests/:id PATCH] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/reputation/requests/[id]');
