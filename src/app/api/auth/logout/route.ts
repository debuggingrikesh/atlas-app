import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/auth/logout
 *
 * Signs the user out and clears the session cookie.
 */
async function POST_handler() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error({ message: 'API Error', context: '[logout] Supabase error:', route: 'API' }, error.message);
      return errorResponse('INTERNAL_ERROR', 'Failed to sign out. Please try again.', 500);
    }

    return successResponse({ message: 'Signed out successfully.' });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[logout] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const POST = withErrorHandling(POST_handler, 'POST /api/auth/logout');
