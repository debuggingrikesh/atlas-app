import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Generate request ID
  const requestId = crypto.randomUUID();
  request.headers.set('x-request-id', requestId);

  // Skip proxy logic for API routes, static assets, and the auth callback
  if (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') ||
    pathname === '/auth/callback'
  ) {
    const response = NextResponse.next({ request });
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Always refresh the Supabase session first
  const response = await updateSession(request);
  response.headers.set('x-request-id', requestId);

  // Read the current user from Supabase (edge-compatible — no DB call)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;


  // ── Auth pages: redirect away if already authenticated ────────────────────
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/signup';
  if (isAuthenticated && isAuthPage) {
    // Redirect to onboarding; the onboarding layout/dashboard layout
    // will handle the DB checks and redirect to dashboard if complete.
    return NextResponse.redirect(new URL('/onboarding/step/1', request.url));
  }

  // ── Onboarding routes: require authenticated ───────────────────
  if (pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // DB-level check (already-completed onboarding) is handled in the
    // onboarding Server Component layout to avoid Edge/Prisma incompatibility.
    return response;
  }

  // ── Dashboard routes: require authenticated ────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // DB-level check (onboarding complete, membership) is handled in the
    // dashboard Server Component layout for the same reason.
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
