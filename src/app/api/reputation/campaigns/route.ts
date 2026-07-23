/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignService } from '@/modules/reputation/services/campaign-service';
import { createCampaignSchema } from '@/modules/reputation/validators/reputation-schema';

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
    const campaigns = await CampaignService.getCampaigns(businessId);
    return successResponse({ campaigns });
  } catch (err) {
    console.error('[reputation/campaigns GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function POST(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.manage);
    if (memberError) return memberError;

    const result = createCampaignSchema.safeParse(data);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const campaign = await CampaignService.createCampaign(user.id, businessId, result.data);
    return successResponse({ campaign }, 201);
  } catch (err) {
    console.error('[reputation/campaigns POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
