import { withErrorHandling } from '@/lib/api/handler';
import { withRateLimit } from '@/lib/api/rate-limit-handler';

 

import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { signUpSchema } from '@/lib/validators/auth';

/**
 * POST /api/auth/signup
 *
 * Creates a Supabase Auth user ONLY.
 * No Prisma records are created here — all application records are created
 * after email verification during onboarding.
 */
async function POST_handler(request: Request) {
  const body = await request.json();
  const result = signUpSchema.safeParse(body);

  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Invalid input.',
      400
    );
  }

  const { email, password } = result.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    // Do not reveal whether an email is already registered (prevents enumeration)
    if (error.code === 'user_already_exists') {
      return successResponse(
        { message: 'Account created successfully.' },
        200
      );
    }
    // Propagate up so withErrorHandling logs and normalizes it
    throw error;
  }

  return successResponse(
    { message: 'Account created successfully.' },
    201
  );
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'signup', limit: 10, windowMs: 60 * 1000 },
    POST_handler
  ),
  'POST /api/auth/signup'
);
