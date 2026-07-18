import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AIService } from '@/modules/ai/services/ai-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  // Rate limit: 10 generation requests per minute per business
  const { allowed } = await checkRateLimit(`ai_generate_${user.id}`, 10, 60 * 1000);
  if (!allowed) {
    return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many AI generation requests. Please try again later.', 429);
  }

  try {
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON with a businessId field.', 400);
    }

    const { businessId } = body;

    if (!businessId || typeof businessId !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'businessId is required in body.', 400);
    }

    const { errorRes: memberError } = await requirePermission(user.id, businessId, PERMISSIONS.reputation.aiAnalysisGenerate);
    if (memberError) return memberError;
    
    // Hard check: Must be OWNER
    const membership = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true }
    });
    
    if (membership?.role !== 'OWNER') {
      return errorResponse('FORBIDDEN', 'Only the Business Owner can generate reputation intelligence.', 403);
    }

    const result = await AIService.analyzeFeedback(businessId, id);
    if ('error' in result) {
      return errorResponse('INTERNAL_ERROR', result.error, result.status || 400);
    }

    return successResponse(result.response);
  } catch (err: unknown) {
    console.error('[analyze POST] error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
