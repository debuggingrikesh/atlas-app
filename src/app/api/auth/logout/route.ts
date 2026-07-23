/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/auth/logout
 *
 * Signs the user out and clears the session cookie.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[logout] Supabase error:', error.message);
      return errorResponse('INTERNAL_ERROR', 'Failed to sign out. Please try again.', 500);
    }

    return successResponse({ message: 'Signed out successfully.' });
  } catch (err) {
    console.error('[logout] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
