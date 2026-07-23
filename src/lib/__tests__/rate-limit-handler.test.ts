/**
 * Tests for src/lib/api/rate-limit-handler.ts
 *
 * Covers:
 * - resolveClientKey: IPv4, IPv6, malformed, oversized, missing headers, fallback
 * - withRateLimit: allowed requests, denied (429), handler not called when denied,
 *   Retry-After header, rate-limit headers on success, preserved body/status/headers,
 *   RateLimitConfigError propagation, Redis infrastructure failure, sensitive data
 *   does not appear in responses or logs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock the relative path that rate-limit-handler.ts uses at import time.
// Using the alias '@/lib/rate-limit' would resolve to a different module identity
// in Vitest than the relative '../rate-limit' import inside rate-limit-handler.
vi.mock('../rate-limit', () => ({
  checkRateLimit: vi.fn(),
  RateLimitConfigError: class RateLimitConfigError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitConfigError';
    }
  },
}));

import { resolveClientKey, withRateLimit, type RateLimitConfig } from '../api/rate-limit-handler';
import { checkRateLimit } from '../rate-limit';
import { logger } from '@/lib/logger';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', { headers });
}

const ALLOWED_RESULT = { allowed: true, remaining: 9, resetTime: Date.now() + 60_000 };
const DENIED_RESULT  = { allowed: false, remaining: 0, resetTime: Date.now() + 30_000 };

const mockCheck = checkRateLimit as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── resolveClientKey ─────────────────────────────────────────────────────────

describe('resolveClientKey', () => {
  it('extracts first (leftmost) IPv4 from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' });
    expect(resolveClientKey(req)).toBe('192.168.1.1');
  });

  it('accepts valid IPv4 from x-forwarded-for with whitespace', () => {
    const req = makeRequest({ 'x-forwarded-for': '  203.0.113.5  ' });
    expect(resolveClientKey(req)).toBe('203.0.113.5');
  });

  it('accepts valid IPv6 from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '2001:db8::1' });
    expect(resolveClientKey(req)).toBe('2001:db8::1');
  });

  it('falls through to x-real-ip when x-forwarded-for is missing', () => {
    const req = makeRequest({ 'x-real-ip': '10.0.0.5' });
    expect(resolveClientKey(req)).toBe('10.0.0.5');
  });

  it('rejects malformed x-forwarded-for value and falls through', () => {
    const req = makeRequest({ 'x-forwarded-for': 'not-an-ip' });
    // Falls to x-real-ip (absent), then UUID
    const key = resolveClientKey(req);
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(key).not.toBe('not-an-ip');
  });

  it('rejects oversized x-forwarded-for header and falls through to UUID', () => {
    const oversized = '1.2.3.4, '.repeat(50);  // > 256 bytes
    const req = makeRequest({ 'x-forwarded-for': oversized });
    const key = resolveClientKey(req);
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns per-request UUID when no headers present', () => {
    const key1 = resolveClientKey(makeRequest());
    const key2 = resolveClientKey(makeRequest());
    expect(key1).toMatch(/^[0-9a-f-]{36}$/);
    expect(key2).toMatch(/^[0-9a-f-]{36}$/);
    // Two different requests produce different fallback UUIDs
    expect(key1).not.toBe(key2);
  });

  it('does not collapse all unknown requests into one bucket', () => {
    const keys = new Set(
      Array.from({ length: 5 }, () => resolveClientKey(makeRequest()))
    );
    expect(keys.size).toBe(5);
  });
});

// ── withRateLimit ────────────────────────────────────────────────────────────

describe('withRateLimit', () => {
  const config: RateLimitConfig = {
    namespace: 'test_ns',
    limit: 5,
    windowMs: 60_000,
  };

  it('allowed request reaches the handler', async () => {
    mockCheck.mockResolvedValueOnce(ALLOWED_RESULT);
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(makeRequest(), {});

    expect(handler).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });

  it('denied request returns 429 and does NOT invoke the handler', async () => {
    mockCheck.mockResolvedValueOnce(DENIED_RESULT);
    const handler = vi.fn();

    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(makeRequest(), {});

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(429);

    const json = await response.json();
    expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(json.success).toBe(false);
  });

  it('includes Retry-After on 429 response', async () => {
    const resetTime = Date.now() + 45_000;
    mockCheck.mockResolvedValueOnce({ allowed: false, remaining: 0, resetTime });
    const handler = vi.fn();

    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(makeRequest(), {});

    const retryAfter = Number(response.headers.get('Retry-After'));
    // Allow ±2s for test execution time
    expect(retryAfter).toBeGreaterThanOrEqual(43);
    expect(retryAfter).toBeLessThanOrEqual(45);
  });

  it('rate-limit headers use millisecond epoch for X-RateLimit-Reset (Upstash v2)', async () => {
    const resetTime = Date.now() + 60_000;
    mockCheck.mockResolvedValueOnce({ allowed: true, remaining: 3, resetTime });
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(makeRequest(), {});

    const resetHeader = Number(response.headers.get('X-RateLimit-Reset'));
    expect(resetHeader).toBe(resetTime);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
  });

  it('preserves downstream response status, body, and existing headers', async () => {
    mockCheck.mockResolvedValueOnce(ALLOWED_RESULT);
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'hello' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'keep-me' },
      })
    );

    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(makeRequest(), {});

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toBe('hello');
    expect(response.headers.get('X-Custom')).toBe('keep-me');
    // Rate-limit headers also present
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
  });

  it('RateLimitConfigError is NOT caught — propagates to withErrorHandling', async () => {
    const { RateLimitConfigError } = await import('../rate-limit');
    mockCheck.mockRejectedValueOnce(new RateLimitConfigError('Redis URL missing'));

    const handler = vi.fn();
    const wrapped = withRateLimit(config, handler);

    await expect(wrapped(makeRequest(), {})).rejects.toThrow('Redis URL missing');
    expect(handler).not.toHaveBeenCalled();
  });

  it('Redis infrastructure error propagates (never returns allowed=true)', async () => {
    mockCheck.mockRejectedValueOnce(new Error('Connection timed out'));

    const wrapped = withRateLimit(config, vi.fn());
    await expect(wrapped(makeRequest(), {})).rejects.toThrow('Connection timed out');
  });

  it('uses custom keyGenerator when provided', async () => {
    const keyGen = vi.fn().mockResolvedValue('user-abc123');
    mockCheck.mockResolvedValueOnce(ALLOWED_RESULT);
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const cfg: RateLimitConfig = { ...config, keyGenerator: keyGen };
    const wrapped = withRateLimit(cfg, handler);
    await wrapped(makeRequest(), {});

    expect(keyGen).toHaveBeenCalled();
    // Key must include both namespace and the custom value
    const calledKey = mockCheck.mock.calls[0]?.[0] as string;
    expect(calledKey).toContain('test_ns');
    expect(calledKey).toContain('user-abc123');
  });

  it('does not expose namespace or key in the 429 response body', async () => {
    mockCheck.mockResolvedValueOnce(DENIED_RESULT);

    const wrapped = withRateLimit({ ...config, namespace: 'internal_secret_ns' }, vi.fn());
    const response = await wrapped(makeRequest(), {});
    const text = await response.text();

    expect(text).not.toContain('internal_secret_ns');
    expect(text).not.toContain('test_ns');
  });

  it('does not expose IP or key material in 429 response body', async () => {
    mockCheck.mockResolvedValueOnce(DENIED_RESULT);

    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4' });
    const wrapped = withRateLimit(config, vi.fn());
    const response = await wrapped(req, {});
    const text = await response.text();

    expect(text).not.toContain('1.2.3.4');
  });

  it('rate-limit warning log does not contain IP address', async () => {
    mockCheck.mockResolvedValueOnce(DENIED_RESULT);

    const req = makeRequest({ 'x-forwarded-for': '5.5.5.5' });
    const wrapped = withRateLimit(config, vi.fn());
    await wrapped(req, {});

    const warnCalls = (logger.warn as ReturnType<typeof vi.fn>).mock.calls;
    const logOutput = JSON.stringify(warnCalls);
    expect(logOutput).not.toContain('5.5.5.5');
  });

  it('IPv4 address resolved from header is accepted (no error thrown)', async () => {
    mockCheck.mockResolvedValueOnce(ALLOWED_RESULT);
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const req = makeRequest({ 'x-forwarded-for': '203.0.113.1' });
    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(req, {});
    expect(response.status).toBe(200);
  });

  it('IPv6 address resolved from header is accepted (no error thrown)', async () => {
    mockCheck.mockResolvedValueOnce(ALLOWED_RESULT);
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const req = makeRequest({ 'x-forwarded-for': '2001:db8::1' });
    const wrapped = withRateLimit(config, handler);
    const response = await wrapped(req, {});
    expect(response.status).toBe(200);
  });
});
