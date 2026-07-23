import { logger } from '@/lib/logger';
 

import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { publicReviewSubmissionSchema } from '@/modules/reputation/validators/reputation-schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTurnstileEnv } from '@/lib/env.server';

interface Params {
  params: Promise<{ token: string }>;
}

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

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  try {
    // Rate limit: 5 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await checkRateLimit(`public_review_${ip}`, 5, 60 * 1000);
    if (!allowed) {
      return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
    }

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
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitConfigError') {
      logger.error({ message: 'API Error', context: `[RateLimiter] Configuration error: ${err.message}`, route: 'API' });
      return errorResponse('INTERNAL_ERROR', 'Service temporarily unavailable.', 500);
    }
    logger.error({ message: 'API Error', context: '[public/reviews/:token POST] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
