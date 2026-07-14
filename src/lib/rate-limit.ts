interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitCache = new Map<string, RateLimitRecord>();

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
      if (now > value.resetTime) {
        rateLimitCache.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

/**
 * Basic in-memory rate limiter for MVP use cases.
 * Returns true if the request is allowed, false if rate limited.
 *
 * NOTE: This is in-memory and therefore scoped to the current Node/Vercel server instance.
 * For true distributed rate limiting, replace this with Upstash Redis or Vercel Edge Config.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  
  let record = rateLimitCache.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
    rateLimitCache.set(key, record);
  }
  
  record.count++;
  
  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  
  return { allowed, remaining, resetTime: record.resetTime };
}
