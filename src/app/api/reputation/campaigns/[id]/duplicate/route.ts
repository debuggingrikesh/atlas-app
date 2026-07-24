import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { REPUTATION_PERMISSIONS } from '@/modules/reputation/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignService } from '@/modules/reputation/services/campaign-service';

interface Params {
  params: Promise<{ id: string }>;
}

async function POST_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.CAMPAIGN_CREATE);
    if (memberError) return memberError;

    const campaign = await CampaignService.duplicateCampaign(user.id, id, businessId);
    return successResponse({ campaign }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Campaign not found') {
      return errorResponse('NOT_FOUND', 'Campaign not found.', 404);
    }
    logger.error({ message: 'API Error', context: '[reputation/campaigns/:id/duplicate POST] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const POST = withErrorHandling(POST_handler, 'POST /api/reputation/campaigns/[id]/duplicate');
