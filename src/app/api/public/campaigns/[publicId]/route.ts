 

import { successResponse, errorResponse } from '@/lib/api/response';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { publicReviewSubmissionSchema } from '@/modules/reputation/validators/reputation-schema';
import { checkRateLimit } from '@/lib/rate-limit';

interface Params {
  params: Promise<{ publicId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { publicId } = await params;

  try {
    const response = await FeedbackService.getCampaignDetailsByPublicId(publicId);

    if (response.error || !response.campaign) {
      return errorResponse('VALIDATION_ERROR', response.error || 'Invalid campaign link.', response.status || 400);
    }

    return successResponse({
      valid: true,
      business: {
        name: response.campaign.business.name,
        logoUrl: response.campaign.business.logoUrl,
      },
      campaign: {
        name: response.campaign.name,
      }
    });
  } catch (err) {
    console.error('[public/campaigns/:publicId GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { publicId } = await params;

  // Rate limit: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = await checkRateLimit(`public_campaign_${ip}`, 5, 60 * 1000);
  if (!allowed) {
    return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
  }

  try {
    const body = await request.json();
    const result = publicReviewSubmissionSchema.safeParse(body);
    
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
    }

    const response = await FeedbackService.submitCampaignReview(publicId, result.data);

    if ('error' in response) {
      return errorResponse('VALIDATION_ERROR', response.error as string, response.status || 400);
    }

    return successResponse(response);
  } catch (err) {
    console.error('[public/campaigns/:publicId POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
