

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { resolveRequestId } from '@/lib/api/handler';
import { createInvitationSchema } from '@/modules/invitations/validators';
import { createInvitation } from '@/modules/invitations/lib/create-invitation';
import { getInvitations } from '@/modules/invitations/lib/get-invitations';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withRateLimit } from '@/lib/api/rate-limit-handler';
import { withErrorHandling } from '@/lib/api/handler';

interface Params {
  params: Promise<{ businessId: string }>;
}

/**
 * POST /api/business/[businessId]/invitations
 *
 * Rate limit: 10 invitations per minute per IP.
 * Prevents invitation-mailer abuse (email spam via the invitation system).
 * Key strategy: IP-based; auth happens inside the handler after rate check.
 * Previous limit: none.
 */
async function postInvitationHandler(request: Request, context: unknown): Promise<Response> {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await (context as Params).params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  const body = await request.json();
  const result = createInvitationSchema.safeParse(body);

  if (!result.success) {
    return errorResponse('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const { invitation, rawToken, errorRes } = await createInvitation(user.id, businessId, result.data, requestId);
  if (errorRes) return errorRes;

  // Never expose raw token in production API responses
  const isDev = process.env.NODE_ENV === 'development';
  return successResponse(
    { invitation, ...(isDev && rawToken ? { rawToken } : {}) },
    201
  );
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'invitation_create', limit: 10, windowMs: 60 * 1000 },
    postInvitationHandler
  ),
  'POST /api/business/[businessId]/invitations'
);

/**
 * GET /api/business/[businessId]/invitations
 *
 * No rate limit in this story — read-only, requires auth and permission.
 * Staged rollout: add limit in a later story if needed.
 */
async function GET_handler(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.read);
  if (permError) return permError;

  const invitations = await getInvitations(businessId);
  return successResponse({ invitations });
}

export const GET = withErrorHandling(GET_handler, 'GET /api/business/[businessId]/invitations');
