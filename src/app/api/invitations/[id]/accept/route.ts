import { withErrorHandling } from '@/lib/api/handler';
import { withRateLimit } from '@/lib/api/rate-limit-handler';

 

import { requireAuth } from '@/lib/auth/require-auth';
import { resolveRequestId } from '@/lib/api/handler';
import { acceptInvitation } from '@/modules/invitations/lib/accept-invitation';
import { successResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/invitations/[id]/accept
 * Accepts an invitation using the raw token (passed via the id param segment).
 */
async function POST_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const token = id;

  const requestId = resolveRequestId(request.headers.get('x-request-id'));
  const { errorRes } = await acceptInvitation(user.id, user.email, token, requestId);
  if (errorRes) return errorRes;

  return successResponse({ success: true });
}

export const POST = withErrorHandling(
  withRateLimit(
    { namespace: 'invitation_accept', limit: 10, windowMs: 60 * 1000 },
    POST_handler
  ),
  'POST /api/invitations/[id]/accept'
);
