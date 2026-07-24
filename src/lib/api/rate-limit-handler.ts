/**
 * src/lib/api/rate-limit-handler.ts
 *
 * Typed withRateLimit wrapper for Next.js App Router route handlers.
 *
 * Composition contract:
 *   export const POST = withErrorHandling(
 *     withRateLimit(config, handler),
 *     'POST /api/example',
 *   );
 *
 * Behaviour:
 * - Resolves a safe client identifier from the request (see resolveClientKey).
 * - Delegates to checkRateLimit from src/lib/rate-limit.ts.
 * - On limit exceeded: returns 429 directly with standard rate-limit headers.
 * - On allowed: injects X-RateLimit-* headers into the downstream response.
 * - On RateLimitConfigError or any Redis failure: throws so withErrorHandling
 *   can normalize and log it. Never swallows config/infrastructure failures.
 * - Never returns allowed=true on configuration failure.
 *
 * Limitations (NAT / proxy):
 *   IP-based limiting is a reasonable first layer, but clients behind corporate
 *   NAT or shared egress may share a single IP. For authenticated routes use a
 *   keyGenerator based on a verified identity instead of relying on the IP fallback.
 *   This module does not perform device fingerprinting.
 */

import { NextResponse } from 'next/server';
import { checkRateLimit } from '../rate-limit';
import { logger } from '../logger';

// Match the RouteHandler type used by withErrorHandling
type RouteHandler<TContext = unknown> = (request: Request, context: TContext) => Promise<Response> | Response;

/** Maximum byte length we accept for a forwarded-for header value. */
const MAX_FORWARDED_FOR_BYTES = 256;

/**
 * Regex: matches a single IPv4 or IPv6 address segment (no port, no CIDR).
 * Deliberately conservative — anything exotic falls back to the safe fallback.
 */
const IP_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^[0-9a-fA-F:]{2,39}$/;

/**
 * Resolve a safe, canonicalized client identifier for rate-limit keying.
 *
 * Strategy (in order):
 *  1. x-forwarded-for — first (leftmost) token only, validated against IP_REGEX.
 *     The header is set by Vercel / reverse proxies; we take only the leftmost
 *     value (the original client IP as observed by the first proxy). We do NOT
 *     trust any other position because downstream servers can spoof them.
 *  2. x-real-ip — single value set by some proxies; validated same way.
 *  3. Per-request UUID fallback — avoids collapsing all unknown clients into one
 *     shared 'unknown' bucket, which would make the rate-limit meaningless.
 *     Using per-request IDs means no rate-limiting for truly unknown origins;
 *     this is intentional and safer than a single shared bucket.
 *
 * We never log the resolved identifier.
 */
export function resolveClientKey(request: Request): string {
  // 1. x-forwarded-for
  const xff = request.headers.get('x-forwarded-for');
  if (xff && Buffer.byteLength(xff, 'utf8') <= MAX_FORWARDED_FOR_BYTES) {
    const first = xff.split(',')[0]?.trim();
    if (first && IP_REGEX.test(first)) {
      return first;
    }
  }

  // 2. x-real-ip
  const xri = request.headers.get('x-real-ip');
  if (xri && xri.length <= MAX_FORWARDED_FOR_BYTES) {
    const trimmed = xri.trim();
    if (IP_REGEX.test(trimmed)) {
      return trimmed;
    }
  }

  // 3. Per-request UUID fallback
  return crypto.randomUUID();
}

export interface RateLimitConfig {
  /**
   * Stable prefix used in the Redis key. Must not contain dynamic data
   * (IDs, IPs, tokens). Example: 'login', 'public_review'.
   */
  namespace: string;

  /** Maximum requests allowed per window. */
  limit: number;

  /** Sliding window size in milliseconds. */
  windowMs: number;

  /**
   * Optional custom key resolver for authenticated routes.
   * Receives the Request and should return a stable string (e.g. userId).
   * When provided, overrides IP resolution entirely — no fallback to IP occurs.
   * The returned value is combined with namespace; never log it if it is a PII field.
   */
  keyGenerator?: (request: Request) => Promise<string> | string;
}

/**
 * withRateLimit — Higher-Order Function that wraps a route handler.
 *
 * Rate-limit exceeded => 429 returned directly (does not invoke the handler).
 * Config / Redis failure => error is thrown, propagating to withErrorHandling.
 */
export function withRateLimit<TContext = unknown>(config: RateLimitConfig, handler: RouteHandler<TContext>): RouteHandler<TContext> {
  return async (request: Request, context: TContext): Promise<Response> => {
    // Resolve the per-request key component
    const keyPart = config.keyGenerator
      ? await config.keyGenerator(request)
      : resolveClientKey(request);

    const rateLimitKey = `${config.namespace}_${keyPart}`;

    // checkRateLimit throws RateLimitConfigError if Redis is unconfigured.
    // We intentionally do NOT catch here — let withErrorHandling handle it.
    const { allowed, remaining, resetTime } = await checkRateLimit(
      rateLimitKey,
      config.limit,
      config.windowMs,
    );

    // resetTime from @upstash/ratelimit v2 is Unix ms timestamp
    const retryAfterSecs = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));

    const rlHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String(config.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime), // ms epoch, consistent with Upstash
    };

    if (!allowed) {
      logger.warn({
        message: 'Rate limit exceeded',
        namespace: config.namespace,
        route: request.url.split('?')[0], // path only, no query params
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: {
            ...rlHeaders,
            'Retry-After': String(retryAfterSecs),
          },
        },
      );
    }

    // Invoke the handler and clone headers onto the response
    const response = await handler(request, context);

    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', rlHeaders['X-RateLimit-Limit']!);
    newHeaders.set('X-RateLimit-Remaining', rlHeaders['X-RateLimit-Remaining']!);
    newHeaders.set('X-RateLimit-Reset', rlHeaders['X-RateLimit-Reset']!);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
