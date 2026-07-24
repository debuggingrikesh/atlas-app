import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { z } from 'zod';

interface Params {
  params: Promise<{ id: string }>;
}

const patchFeedbackSchema = z.object({
  businessId: z.string().min(1),
  status: z.enum(['UNREAD', 'REVIEWED', 'RESOLVED']),
});

async function PATCH_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const result = patchFeedbackSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const { businessId, status } = result.data;

    // Must have reputation.manage or reputation.feedbackView permission
    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.manage);
    if (memberError) return memberError;

    const updated = await FeedbackService.updateFeedbackStatus(id, businessId, status);
    if (!updated) {
      return errorResponse('NOT_FOUND', 'Feedback not found or could not be updated.', 404);
    }

    return successResponse({ success: true });
  } catch (err: any) {
    logger.error({ message: 'API Error', context: '[reputation/feedback/:id PATCH] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/reputation/feedback/[id]');
