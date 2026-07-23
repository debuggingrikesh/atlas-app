/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

function getOrGenerateRequestId(request: NextRequest): string {
  const incomingId = request.headers.get('x-request-id');
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (incomingId && uuidv4Regex.test(incomingId)) {
    return incomingId;
  }
  return crypto.randomUUID();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Generate or accept valid request ID
  const requestId = getOrGenerateRequestId(request);
  request.headers.set('x-request-id', requestId);

  const startTime = Date.now();
  
  // Skip proxy logic for API routes, static assets, and the auth callback
  if (
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') ||
    pathname === '/auth/callback'
  ) {
    const response = NextResponse.next({ request });
    response.headers.set('x-request-id', requestId);
    
    // We don't trace static assets in DB metrics, but we can trace API routes
    if (pathname.startsWith('/api/')) {
      const duration = Date.now() - startTime;
      reportMetricEdge(request, 'http.duration', duration, response.status);
    }
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
      reportMetricEdge(request, 'http.duration', Date.now() - startTime, 307);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // DB-level check (onboarding complete, membership) is handled in the
    // dashboard Server Component layout for the same reason.
    reportMetricEdge(request, 'http.duration', Date.now() - startTime, 200);
    return response;
  }

  reportMetricEdge(request, 'http.duration', Date.now() - startTime, 200);
  return response;
}

function reportMetricEdge(req: NextRequest, metric: string, value: number, status: number) {
  // Fire and forget to internal metric collector (avoids blocking response)
  const secret = process.env.HQ_INTERNAL_API_SECRET;
  if (!secret) return;

  // Use absolute URL since relative fetch is not allowed in middleware
  const url = new URL('/api/internal/operational-metrics', req.url).toString();
  
  // Determine status class (2xx, 3xx, 4xx, 5xx)
  const statusClass = `${Math.floor(status / 100)}xx`;
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metric,
      value,
      opts: {
        route: req.nextUrl.pathname,
        method: req.method,
        statusClass
      }
    })
  }).catch(() => { /* silent fail for metrics */ });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
