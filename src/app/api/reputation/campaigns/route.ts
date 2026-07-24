import { withErrorHandling } from '@/lib/api/handler';
import { withRateLimit } from '@/lib/api/rate-limit-handler';

 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { REPUTATION_PERMISSIONS } from '@/modules/reputation/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignService } from '@/modules/reputation/services/campaign-service';
import { createCampaignSchema } from '@/modules/reputation/validators/reputation-schema';

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

  const campaigns = await CampaignService.getCampaigns(businessId);
  return successResponse({ campaigns });
}

async function POST_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const { businessId, ...data } = body;

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.CAMPAIGN_CREATE);
  if (memberError) return memberError;

  const result = createCampaignSchema.safeParse(data);
  if (!result.success) {
    return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  const campaign = await CampaignService.createCampaign(user.id, businessId, result.data);
  return successResponse({ campaign }, 201);
}

export const GET = withErrorHandling(GET_handler, 'GET /api/reputation/campaigns');

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'campaign_create', limit: 10, windowMs: 60 * 1000 },
    POST_handler
  ),
  'POST /api/reputation/campaigns'
);
