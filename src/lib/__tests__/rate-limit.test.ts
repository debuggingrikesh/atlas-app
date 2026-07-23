import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';


// Mock the getRedisLazy implementation through module mocking or just testing environment
vi.mock('server-only', () => ({}));
vi.mock('@upstash/ratelimit', () => {
  const RatelimitMock = vi.fn().mockImplementation(function() {
    return {
      limit: vi.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 })
    };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (RatelimitMock as any).slidingWindow = vi.fn();
  return {
    Ratelimit: RatelimitMock
  };
});

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(function() { return {}; })
  };
});

describe('Rate Limit', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('complete valid configuration reaches the Redis-backed path', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://valid-url.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'valid-token');
    const { checkRateLimit } = await import('../rate-limit');

    const result = await checkRateLimit('test_key', 10, 60000);
    expect(result.allowed).toBe(true);
  });

  it('missing URL fails closed', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'valid-token');
    const { checkRateLimit, RateLimitConfigError } = await import('../rate-limit');

    let error: unknown;
    try {
      await checkRateLimit('test_key', 10, 60000);
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeInstanceOf(RateLimitConfigError);
    const err = error as Error;
    expect(err.message).toContain('UPSTASH_REDIS_REST_URL or TOKEN is missing');
    expect(err.message).not.toContain('valid-token');
  });

  it('missing token fails closed', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://valid-url.upstash.io');
    const { checkRateLimit, RateLimitConfigError } = await import('../rate-limit');

    let error: unknown;
    try {
      await checkRateLimit('test_key', 10, 60000);
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeInstanceOf(RateLimitConfigError);
    const err2 = error as Error;
    expect(err2.message).toContain('UPSTASH_REDIS_REST_URL or TOKEN is missing');
    expect(err2.message).not.toContain('https://valid-url.upstash.io');
  });

  it('configuration failure never returns allowed: true', async () => {
    const { checkRateLimit } = await import('../rate-limit');

    await expect(checkRateLimit('test_key', 10, 60000)).rejects.toThrow('UPSTASH_REDIS_REST_URL or TOKEN is missing');
  });
});
