import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { CampaignService } from '@/modules/reputation/services/campaign-service';
import { updateCampaignSchema } from '@/modules/reputation/validators/reputation-schema';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
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
    console.error('[reputation/campaigns/:id GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.manage);
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
    console.error('[reputation/campaigns/:id PATCH] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
