import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { REPUTATION_PERMISSIONS } from '@/modules/reputation/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignMetricsService } from '@/modules/reputation/services/campaign-metrics-service';
import { CampaignService } from '@/modules/reputation/services/campaign-service';

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

  const { errorRes: memberError } = await requirePermission(user.id, businessId, REPUTATION_PERMISSIONS.ANALYTICS_VIEW);
  if (memberError) return memberError;

  const { id } = await params;

  try {
    const campaign = await CampaignService.getCampaignById(id, businessId);
    if (!campaign) {
      return errorResponse('NOT_FOUND', 'Campaign not found.', 404);
    }

    const metrics = await CampaignMetricsService.getCampaignMetrics(id, businessId);
    return successResponse({ metrics });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[reputation/campaigns/:id/metrics GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/reputation/campaigns/[id]/metrics');
