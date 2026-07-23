import { logger } from '@/lib/logger';

import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { publicReviewSubmissionSchema } from '@/modules/reputation/validators/reputation-schema';
import { withRateLimit } from '@/lib/api/rate-limit-handler';
import { withErrorHandling } from '@/lib/api/handler';
import { getTurnstileEnv } from '@/lib/env.server';

interface Params {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/public/reviews/[token]
 *
 * No rate limit applied — token-scoped read, low risk.
 */
export async function GET(request: Request, { params }: Params) {
  const { token } = await params;

  try {
    const response = await FeedbackService.getReviewRequestDetails(token);

    if (response.error || !response.request) {
      return errorResponse('VALIDATION_ERROR', response.error || 'Invalid token.', response.status || 400);
    }

    return successResponse({
      valid: true,
      business: {
        name: response.request.business.name,
        logoUrl: response.request.business.logoUrl,
      },
      campaign: {
        name: response.request.campaign.name,
      }
    });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[public/reviews/:token GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

/**
 * POST /api/public/reviews/[token]
 *
 * Highest-abuse-risk public endpoint: unauthenticated review submission.
 * Rate limit: 5 per minute per IP (unchanged from previous inline limit).
 * Key strategy: IP-based (anonymous endpoint).
 */
async function postReviewHandler(request: Request, context: unknown): Promise<Response> {
  const { token } = await (context as Params)['params'];

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const body = await request.json();
  const result = publicReviewSubmissionSchema.safeParse(body);

  if (!result.success) {
    return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  // Validate Turnstile token
  if (!result.data.token) {
    return errorResponse('VALIDATION_ERROR', 'Missing security token.', 400);
  }

  let turnstileSecret: string;
  try {
    turnstileSecret = getTurnstileEnv().TURNSTILE_SECRET_KEY;
  } catch (err) {
    logger.error({ message: 'API Error', context: '[public/reviews/:token POST] TURNSTILE_SECRET_KEY is not configured', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Security configuration error.', 500);
  }

  const formData = new URLSearchParams();
  formData.append('secret', turnstileSecret);
  formData.append('response', result.data.token);
  formData.append('remoteip', ip);

  const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const turnstileResult = await turnstileResponse.json();

  if (!turnstileResult.success) {
    logger.warn({ message: 'API Error', context: '[public/reviews/:token POST] Turnstile validation failed:', route: 'API' }, turnstileResult);
    return errorResponse('VALIDATION_ERROR', 'Security check failed. Please try again.', 400);
  }

  const response = await FeedbackService.submitPublicReview(token, result.data);

  if ('error' in response) {
    return errorResponse('VALIDATION_ERROR', response.error, response.status || 400);
  }

  return successResponse(response);
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'public_review', limit: 5, windowMs: 60 * 1000 },
    postReviewHandler
  ),
  'POST /api/public/reviews/[token]'
);
