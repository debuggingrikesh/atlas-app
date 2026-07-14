import { successResponse, errorResponse } from '@/lib/api/response';
import { UpgradeRequestService } from '@/modules/billing/services/upgrade-request-service';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing admin credentials.', 401);
  }

  try {
    const requests = await UpgradeRequestService.listRequests();
    return successResponse({ requests });
  } catch (err: unknown) {
    console.error('[admin/subscription/upgrade-requests GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
