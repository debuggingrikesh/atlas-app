import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AIService } from '@/modules/ai/services/ai-service';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';

async function GET_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.aiSettingsManage);
  if (memberError) return memberError;

  const canAccess = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_ANALYSIS');
  if (!canAccess) {
    return errorResponse('PAYMENT_REQUIRED', 'AI generation is a paid feature. Please upgrade your subscription.', 402);
  }

  try {
    const settings = await AIService.getSettings(businessId);
    return successResponse(settings || { tone: 'Professional', preferredLanguage: 'English' });
  } catch (err: any) {
    logger.error({ message: 'API Error', context: '[ai-settings GET] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

async function PATCH_handler(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { businessId, tone, brandDescription, preferredLanguage, customInstructions } = body;

    if (!businessId) {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.aiSettingsManage);
    if (memberError) return memberError;

    const canAccess = await EntitlementService.canAccessFeature(businessId, 'AI_REPUTATION_ANALYSIS');
    if (!canAccess) {
      return errorResponse('PAYMENT_REQUIRED', 'AI generation is a paid feature. Please upgrade your subscription.', 402);
    }

    const updated = await AIService.updateSettings(businessId, {
      tone,
      brandDescription,
      preferredLanguage,
      customInstructions
    });

    return successResponse(updated);
  } catch (err: any) {
    logger.error({ message: 'API Error', context: '[ai-settings PATCH] error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export const GET = withErrorHandling(GET_handler, 'GET /api/reputation/ai-settings');

export const PATCH = withErrorHandling(PATCH_handler, 'PATCH /api/reputation/ai-settings');
