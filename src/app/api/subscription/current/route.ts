import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS, FeatureKeySchema, UpgradeRequestStatusSchema } from '@atlas/core';
import { successResponse, errorResponse } from '@/lib/api/response';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';
import { UsageRepository } from '@/modules/reputation/repositories/usage-repository';
import { prisma } from '@/lib/db/prisma';

async function GET_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  // Validate business membership
  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.business.read);
  if (memberError) return memberError;

  try {
    const subscription = await EntitlementService.getSubscription(businessId);
    if (!subscription) {
      return errorResponse('NOT_FOUND', 'Subscription not found.', 404);
    }

    // Get current usage of review requests
    const usage = await UsageRepository.getUsage(businessId, FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS);
    const requestCount = usage ? usage.count : 0;
    
    // Also check for pending upgrade requests
    const pendingRequest = await prisma.upgradeRequest.findFirst({
      where: {
        businessId,
        status: UpgradeRequestStatusSchema.enum.PENDING
      },
      include: {
        requestedPlan: true
      }
    });

    return successResponse({
      subscription,
      usage: {
        reviewRequests: {
          count: requestCount,
          limit: await EntitlementService.getFeatureLimit(businessId, FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS)
        }
      },
      pendingUpgradeRequest: pendingRequest
    });
  } catch (err: any) {
    logger.error({ message: 'API Error', context: '[subscription/current GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/subscription/current');
