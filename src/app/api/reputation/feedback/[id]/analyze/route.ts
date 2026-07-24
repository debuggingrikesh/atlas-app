
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AIService } from '@/modules/ai/services/ai-service';
import { withRateLimit } from '@/lib/api/rate-limit-handler';
import { withErrorHandling, resolveRequestId } from '@/lib/api/handler';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/reputation/feedback/[id]/analyze
 *
 * Rate limit: 10 AI generation requests per minute, keyed by verified user ID.
 *
 * The keyGenerator runs BEFORE auth because withRateLimit is the outer wrapper.
 * To key by user ID, we resolve the authenticated user at key-generation time.
 * We pass through a sentinel string on auth failure; the handler below will
 * then re-check auth and return the correct 401 response.
 *
 * Design note: IP-based limiting is not used here because:
 *   1. The prior implementation already keyed by user.id.
 *   2. AI generation is CPU/cost-intensive; user-scoped limits are more precise.
 *   3. Users behind corporate NAT would be unfairly grouped under IP limits.
 * This is therefore NOT migrated to a plain IP keyGenerator.
 */
async function analyzeHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await context.params;

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

  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const result = await AIService.analyzeFeedback(businessId, id, user.id, requestId);
  if ('error' in result) {
    return errorResponse('INTERNAL_ERROR', result.error, result.status || 400);
  }

  return successResponse(result.response);
}

/**
 * We must resolve the user ID for the key generator. If auth fails, we return
 * a stable per-request UUID so the handler can still return the 401.
 * We do NOT log or expose the user ID.
 */
async function resolveUserKey(): Promise<string> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Auth resolution failure — fall through to UUID fallback
  }
  return crypto.randomUUID();
}

export const POST = withErrorHandling(
  withRateLimit(
    {
      namespace: 'ai_generate',
      limit: 10,
      windowMs: 60 * 1000,
      keyGenerator: () => resolveUserKey(),
    },
    analyzeHandler
  ),
  'POST /api/reputation/feedback/[id]/analyze'
);
