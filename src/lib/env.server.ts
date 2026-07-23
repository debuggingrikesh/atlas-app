import 'server-only';
import { z } from 'zod';

/**
 * Server-side Environment Validation
 * Never import this file into Client Components.
 * 
 * We use feature-scoped accessors rather than global eager validation
 * to ensure that missing optional keys do not break unrelated routes
 * or build-time rendering (e.g. next build).
 */

const nonEmptyString = (msg: string) => z.string().trim().min(1, msg);
const optionalString = () => z.string().trim().optional().transform(v => v === '' ? undefined : v);

// 1. Core required variables
const coreSchema = z.object({
  DATABASE_URL: nonEmptyString('DATABASE_URL is required'),
  DIRECT_URL: nonEmptyString('DIRECT_URL is required'),
  NEXT_PUBLIC_SUPABASE_URL: nonEmptyString('NEXT_PUBLIC_SUPABASE_URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmptyString('NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: nonEmptyString('NEXT_PUBLIC_APP_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: nonEmptyString('SUPABASE_SERVICE_ROLE_KEY is required'),
});

export const getCoreEnv = () => {
  const result = coreSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid Core Environment Configuration:');
    result.error.issues.forEach((err: z.ZodIssue) => console.error(` - ${err.message}`));
    throw new Error('Invalid core environment configuration. Check server logs.');
  }
  return result.data;
};

// 2. Feature-required variables: AI
const aiFeatureSchema = z.object({
  GEMINI_API_KEY: nonEmptyString('GEMINI_API_KEY is required for AI features')
});

export const getAiEnv = () => {
  const result = aiFeatureSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`AI Feature configuration missing: ${result.error.issues[0].message}`);
  }
  return result.data;
};

// 3. Feature-required variables: Email
const emailFeatureSchema = z.object({
  RESEND_API_KEY: nonEmptyString('RESEND_API_KEY is required for Email features'),
  EMAIL_FROM_ADDRESS: optionalString()
});

export const getEmailEnv = () => {
  const result = emailFeatureSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Email Feature configuration missing: ${result.error.issues[0].message}`);
  }
  return result.data;
};

// 4. Feature-required variables: Turnstile
const turnstileFeatureSchema = z.object({
  TURNSTILE_SECRET_KEY: nonEmptyString('TURNSTILE_SECRET_KEY is required for CAPTCHA')
});

export const getTurnstileEnv = () => {
  const result = turnstileFeatureSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Turnstile configuration missing: ${result.error.issues[0].message}`);
  }
  return result.data;
};

// 5. Feature-required variables: Rate Limiting
const rateLimitFeatureSchema = z.object({
  UPSTASH_REDIS_REST_URL: nonEmptyString('UPSTASH_REDIS_REST_URL is required for rate limiting'),
  UPSTASH_REDIS_REST_TOKEN: nonEmptyString('UPSTASH_REDIS_REST_TOKEN is required for rate limiting')
});

export const getRateLimitEnv = () => {
  const result = rateLimitFeatureSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Rate Limit configuration missing: ${result.error.issues[0].message}`);
  }
  return result.data;
};

// 6. Feature-required variables: Internal Auth
const internalAuthSchema = z.object({
  HQ_INTERNAL_API_SECRET: nonEmptyString('HQ_INTERNAL_API_SECRET is required for Internal APIs'),
  HQ_INTERNAL_API_SECRET_PREVIOUS: optionalString()
});

export const getInternalAuthEnv = () => {
  const result = internalAuthSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Internal Auth configuration missing: ${result.error.issues[0].message}`);
  }
  return result.data;
};
