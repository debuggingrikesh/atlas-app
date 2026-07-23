 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';

export async function GET(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');
  const pageStr = url.searchParams.get('page') || '1';
  const limitStr = url.searchParams.get('limit') || '20';

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.feedbackView);
  if (memberError) return memberError;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = Math.max(1, parseInt(limitStr, 10) || 20);

  try {
    const feedback = await FeedbackService.getFeedback(businessId, page, limit);
    return successResponse({ feedback });
  } catch (err) {
    console.error('[reputation/feedback GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
