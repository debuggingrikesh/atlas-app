/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ReputationSettingsService } from '@/modules/reputation/services/reputation-settings-service';
import { updateReputationSettingsSchema } from '@/modules/reputation/validators/reputation-schema';

export async function GET(request: Request) {
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
    console.error('[reputation/settings GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function PATCH(request: Request) {
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

    const settings = await ReputationSettingsService.updateSettings(user.id, businessId, result.data);
    return successResponse({ settings });
  } catch (err) {
    console.error('[reputation/settings PATCH] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
