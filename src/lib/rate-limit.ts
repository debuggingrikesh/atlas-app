 

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const getRedis = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
};

export const redis = getRedis();

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
  
  if (!redis) {
    // Fallback for local development if Redis is not configured
    console.warn('[RateLimiter] UPSTASH_REDIS_REST_URL missing. Skipping rate limit.');
    return { allowed: true, remaining: limit, resetTime: now + windowMs };
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
