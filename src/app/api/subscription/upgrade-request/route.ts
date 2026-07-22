import { requireAuth } from '@/lib/auth/require-auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { UpgradeRequestService } from '@/modules/billing/services/upgrade-request-service';

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult.errorRes) return authResult.errorRes;
  const user = authResult.user;

  try {
    const body = await request.json();
    const { businessId, note } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required.', 400);
    }

    // Authorize using RBAC
    const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.billing.manage);
    if (permError) return permError;

    const result = await UpgradeRequestService.createRequest(businessId, 'PRO', user.id, note);
    if ('error' in result && typeof result.error === 'string') {
      return errorResponse('VALIDATION_ERROR', result.error, result.status || 400);
    }

    return successResponse({ request: result.request }, 201);
  } catch (err: unknown) {
    console.error('[subscription/upgrade-request POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
