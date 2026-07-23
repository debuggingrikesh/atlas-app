import { logger } from '@/lib/logger';
 

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { loginSchema } from '@/lib/validators/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/auth/login
 *
 * Authenticates the user with email + password via Supabase.
 * Sets the session cookie automatically via the SSR client.
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 10 login attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await checkRateLimit(`login_${ip}`, 10, 60 * 1000);
    if (!allowed) {
      return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many login attempts. Please try again later.', 429);
    }

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
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitConfigError') {
      logger.error({ message: 'API Error', context: `[RateLimiter] Configuration error: ${err.message}`, route: 'API' });
      return errorResponse('INTERNAL_ERROR', 'Service temporarily unavailable.', 500);
    }
    logger.error({ message: 'API Error', context: '[login] Unexpected error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
