import { successResponse, errorResponse } from '@/lib/api/response';
import { UpgradeRequestService } from '@/modules/billing/services/upgrade-request-service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return errorResponse('UNAUTHORIZED', 'Invalid or missing admin credentials.', 401);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return errorResponse('VALIDATION_ERROR', 'Action must be APPROVE or REJECT.', 400);
    }

    let updatedRequest;
    if (action === 'APPROVE') {
      updatedRequest = await UpgradeRequestService.approveRequest(id);
    } else {
      updatedRequest = await UpgradeRequestService.rejectRequest(id);
    }

    return successResponse({ request: updatedRequest });
  } catch (err: unknown) {
    console.error('[admin/subscription/upgrade-requests/[id]/action POST] error:', err);
    return errorResponse(
      'INTERNAL_ERROR',
      err instanceof Error ? err.message : 'An unexpected error occurred.',
      500
    );
  }
}
