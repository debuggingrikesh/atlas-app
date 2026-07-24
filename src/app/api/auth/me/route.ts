import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { getUserProfile } from '@/modules/auth/lib/get-user-profile';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile and business memberships.
 * Returns null profile data if onboarding is not yet complete.
 */
async function GET_handler() {
  const { user, errorRes } = await requireAuth();
  if (errorRes) return errorRes;

  try {
    const profile = await getUserProfile(user.id);

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.emailConfirmedAt,
      },
      profile,
    });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[me] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/auth/me');
