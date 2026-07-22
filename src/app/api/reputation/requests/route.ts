import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ReviewRequestService } from '@/modules/reputation/services/review-request-service';
import { createReviewRequestSchema } from '@/modules/reputation/validators/reputation-schema';

export async function POST(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.requestCreate);
    if (memberError) return memberError;

    const result = createReviewRequestSchema.safeParse(data);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const response = await ReviewRequestService.createRequest(user.id, businessId, result.data);
    
    if (response.error) {
      return errorResponse('VALIDATION_ERROR', response.error, response.status || 400);
    }

    return successResponse({ request: response.request }, 201);
  } catch (err) {
    console.error('[reputation/requests POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
