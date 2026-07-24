import { withErrorHandling } from '@/lib/api/handler';
import { withRateLimit } from '@/lib/api/rate-limit-handler';

 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { resolveRequestId } from '@/lib/api/handler';
import { resendInvitation } from '@/modules/invitations/lib/resend-invitation';
import { successResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string; id: string }>;
}

/**
 * POST /api/business/[businessId]/invitations/[id]/resend
 */
async function POST_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, id } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const { invitation, rawToken, errorRes } = await resendInvitation(user.id, businessId, id, requestId);
  if (errorRes) return errorRes;

  // Never expose raw token in production API responses
  const isDev = process.env.NODE_ENV === 'development';
  return successResponse({
    invitation,
    ...(isDev && rawToken ? { rawToken } : {})
  });
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'invitation_resend', limit: 5, windowMs: 60 * 1000 },
    POST_handler
  ),
  'POST /api/business/[businessId]/invitations/[id]/resend'
);
