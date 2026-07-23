/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /auth/callback
 *
 * Handles the Supabase PKCE callback after email verification.
 * Exchanges the one-time code for a user session, then redirects to onboarding.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding/step/1';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[auth/callback] Code exchange failed:', error.message);
  }

  // Redirect to an error page if the code is missing or exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
