 

import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { publicReviewSubmissionSchema } from '@/modules/reputation/validators/reputation-schema';
import { checkRateLimit } from '@/lib/rate-limit';

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
    console.error('[public/reviews/:token GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  // Rate limit: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = await checkRateLimit(`public_review_${ip}`, 5, 60 * 1000);
  if (!allowed) {
    return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
  }

  try {
    const body = await request.json();
    const result = publicReviewSubmissionSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    // Validate Turnstile token
    if (!result.data.token) {
      return errorResponse('VALIDATION_ERROR', 'Missing security token.', 400);
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
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
      console.warn('[public/reviews/:token POST] Turnstile validation failed:', turnstileResult);
      return errorResponse('VALIDATION_ERROR', 'Security check failed. Please try again.', 400);
    }

    const response = await FeedbackService.submitPublicReview(token, result.data);

    if ('error' in response) {
      return errorResponse('VALIDATION_ERROR', response.error, response.status || 400);
    }

    return successResponse(response);
  } catch (err) {
    console.error('[public/reviews/:token POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
