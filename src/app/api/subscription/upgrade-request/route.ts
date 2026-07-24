import { withErrorHandling } from '@/lib/api/handler';
import { withRateLimit } from '@/lib/api/rate-limit-handler';



import { requireAuth } from '@/lib/auth/require-auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { UpgradeRequestService } from '@/modules/billing/services/upgrade-request-service';

async function POST_handler(request: Request) {
  const authResult = await requireAuth();
  if (authResult.errorRes) return authResult.errorRes;
  const user = authResult.user;

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
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'upgrade_request', limit: 5, windowMs: 60 * 1000 },
    POST_handler
  ),
  'POST /api/subscription/upgrade-request'
);
