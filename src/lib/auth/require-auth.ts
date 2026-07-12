import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/api/response';
import type { AuthUser } from '@/modules/auth/types';

/**
 * Validates the current Supabase session and returns the authenticated user.
 * Throws an UNAUTHORIZED error response if no valid session exists.
 *
 * Usage in API route handlers:
 *   const { user, errorRes } = await requireAuth();
 *   if (errorRes) return errorRes;
 */
export async function requireAuth(): Promise<
  | { user: AuthUser; errorRes: null }
  | { user: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      errorRes: errorResponse('UNAUTHORIZED', 'Authentication required.', 401),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      emailConfirmedAt: user.email_confirmed_at ?? null,
    },
    errorRes: null,
  };
}
