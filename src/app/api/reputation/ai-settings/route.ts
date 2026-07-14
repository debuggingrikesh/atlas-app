import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AIService } from '@/modules/ai/services/ai-service';

export async function GET(request: Request) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');

  if (!businessId) {
    return errorResponse('VALIDATION_ERROR', 'businessId is required in query params.', 400);
  }

  const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.aiSettingsManage);
  if (memberError) return memberError;

  try {
    const settings = await AIService.getSettings(businessId);
    return successResponse(settings || { tone: 'Professional', preferredLanguage: 'English' });
  } catch (err: unknown) {
    console.error('[ai-settings GET] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function PATCH(request: Request) {
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

    const updated = await AIService.updateSettings(businessId, {
      tone,
      brandDescription,
      preferredLanguage,
      customInstructions,
    });

    return successResponse(updated);
  } catch (err: unknown) {
    console.error('[ai-settings PATCH] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
