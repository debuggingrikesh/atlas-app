import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { loginSchema } from '@/lib/validators/auth';
import { withRateLimit } from '@/lib/api/rate-limit-handler';
import { withErrorHandling } from '@/lib/api/handler';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/auth/login
 *
 * Authenticates the user with email + password via Supabase.
 * Sets the session cookie automatically via the SSR client.
 *
 * Rate limit: 10 attempts per minute per IP (unchanged from previous inline limit).
 * Key strategy: IP-based (anonymous endpoint — no verified identity available before auth).
 */
async function loginHandler(request: Request): Promise<Response> {
  const body = await request.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Invalid input.',
      400
    );
  }

  const { email, password } = result.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return a generic error — do not reveal whether the email exists
    return errorResponse('UNAUTHORIZED', 'Invalid email or password.', 401);
  }

  // Check if the user is deactivated in our UserProfile database
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.user.id },
    select: { isActive: true },
  });

  if (userProfile && !userProfile.isActive) {
    // Sign out from Supabase immediately to clear the session cookie
    await supabase.auth.signOut();
    return errorResponse('FORBIDDEN', 'Your account has been deactivated.', 403);
  }

  return successResponse({
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmedAt: data.user.email_confirmed_at ?? null,
    },
  });
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'login', limit: 10, windowMs: 60 * 1000 },
    loginHandler
  ),
  'POST /api/auth/login'
);
