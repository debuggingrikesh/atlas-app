 

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

import { getRateLimitEnv } from './env.server';
import { RateLimitConfigError } from './errors';
export { RateLimitConfigError };

let _redis: Redis | null = null;
let _redisInitialized = false;

export const getRedis = () => {
  if (_redisInitialized) return _redis;
  try {
    const env = getRateLimitEnv();
    _redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error('Redis init error:', err);
    _redis = null;
  }
  _redisInitialized = true;
  return _redis;
};


/**
 * Distributed rate limiter using Upstash Redis and @upstash/ratelimit.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const redis = getRedis();
  
  if (!redis) {
    throw new RateLimitConfigError('UPSTASH_REDIS_REST_URL or TOKEN is missing. Rate limiter is not configured.');
  }

  // Create a new ratelimit instance dynamically based on the passed windowMs and limit.
  // Note: For extreme high throughput this instantiation per-request could be optimized, 
  // but it's lightweight and ensures we use Lua scripts atomically.
  const windowSecs = Math.max(1, Math.ceil(windowMs / 1000));
  
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSecs} s`),
    analytics: false,
    prefix: '@upstash/ratelimit',
  });

  const { success, limit: _limit, remaining, reset } = await ratelimit.limit(key);
  
  return { allowed: success, remaining, resetTime: reset };
}
