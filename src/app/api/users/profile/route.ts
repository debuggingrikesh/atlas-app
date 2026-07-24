import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { updateProfile } from '@/modules/auth/lib/update-profile';
import { updateProfileSchema } from '@/lib/validators/auth';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/users/profile
 *
 * Returns the authenticated user's profile including business memberships.
 */
async function GET_handler() {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const profile = await getUserProfile(user.id);
    if (!profile) {
      return errorResponse('NOT_FOUND', 'Profile not found.', 404);
    }
    return successResponse({ profile });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[users/profile GET] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

/**
 * PATCH /api/users/profile
 *
 * Partially updates the authenticated user's profile (fullName, avatarUrl).
 * Runs inside a Prisma transaction and writes an AuditLog entry.
 */
async function PATCH_handler(request: Request) {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid input.',
        400
      );
    }

    const profile = await updateProfile(user.id, user.email!, result.data);
    return successResponse({ profile });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[users/profile PATCH] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/users/profile');

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/users/profile');
