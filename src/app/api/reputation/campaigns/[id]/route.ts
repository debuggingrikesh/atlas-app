import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { REPUTATION_PERMISSIONS } from '@/modules/reputation/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignService } from '@/modules/reputation/services/campaign-service';
import { updateCampaignSchema } from '@/modules/reputation/validators/reputation-schema';

interface Params {
  params: Promise<{ id: string }>;
}

async function GET_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.view);
  if (memberError) return memberError;

  const { id } = await params;

  try {
    const campaign = await CampaignService.getCampaignById(id, businessId);
    if (!campaign) {
      return errorResponse('NOT_FOUND', 'Campaign not found.', 404);
    }
    return successResponse({ campaign });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/campaigns/:id GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

async function PATCH_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.CAMPAIGN_UPDATE);
    if (memberError) return memberError;

    const result = updateCampaignSchema.safeParse(data);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const updated = await CampaignService.updateCampaign(user.id, id, businessId, result.data);
    if (!updated) {
      return errorResponse('NOT_FOUND', 'Campaign not found or could not be updated.', 404);
    }

    const campaign = await CampaignService.getCampaignById(id, businessId);
    return successResponse({ campaign });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/campaigns/:id PATCH] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

async function DELETE_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.CAMPAIGN_ARCHIVE);
  if (memberError) return memberError;

  const { id } = await params;

  try {
    const archived = await CampaignService.archiveCampaign(user.id, id, businessId);
    if (!archived) {
      return errorResponse('NOT_FOUND', 'Campaign not found or could not be archived.', 404);
    }

    return successResponse({ success: true });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/campaigns/:id DELETE] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/reputation/campaigns/[id]');

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/reputation/campaigns/[id]');

export const DELETE = withErrorHandling(DELETE_handler, 'DELETE /api/reputation/campaigns/[id]');
