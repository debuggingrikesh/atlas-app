import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { resolveRequestId } from '@/lib/api/handler';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ReputationSettingsService } from '@/modules/reputation/services/reputation-settings-service';
import { updateReputationSettingsSchema } from '@/modules/reputation/validators/reputation-schema';

async function GET_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.view);
  if (memberError) return memberError;

  try {
    const settings = await ReputationSettingsService.getSettings(businessId);
    return successResponse({ settings });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/settings GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

async function PATCH_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.settingsManage);
    if (memberError) return memberError;

    const result = updateReputationSettingsSchema.safeParse(data);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const requestId = resolveRequestId(request.headers.get('x-request-id'));
    const settings = await ReputationSettingsService.updateSettings(user.id, businessId, result.data, requestId);
    return successResponse({ settings });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/settings PATCH] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/reputation/settings');

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/reputation/settings');
