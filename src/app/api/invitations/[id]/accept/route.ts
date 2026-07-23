import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { acceptInvitation } from '@/modules/invitations/lib/accept-invitation';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/invitations/[id]/accept
 * Accepts an invitation using the raw token (passed via the id param segment).
 */
export async function POST(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const token = id;

  try {
    const { errorRes } = await acceptInvitation(user.id, user.email, token);
    if (errorRes) return errorRes;

    return successResponse({ success: true });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[invitations accept POST] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to accept invitation.', 500);
  }
}
