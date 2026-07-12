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
export async function POST(request: Request) {
  try {
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
      console.error('[signup] Supabase error:', error.message);
      return errorResponse('INTERNAL_ERROR', 'Failed to create account. Please try again.', 500);
    }

    return successResponse(
      { message: 'Account created successfully.' },
      201
    );
  } catch (err) {
    console.error('[signup] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
