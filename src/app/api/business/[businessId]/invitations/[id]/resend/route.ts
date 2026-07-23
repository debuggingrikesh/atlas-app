import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { resendInvitation } from '@/modules/invitations/lib/resend-invitation';
import { successResponse, errorResponse } from '@/lib/api/response';

interface Params {
  params: Promise<{ businessId: string; id: string }>;
}

/**
 * POST /api/business/[businessId]/invitations/[id]/resend
 */
export async function POST(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, id } = await params;
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  try {
    const { invitation, rawToken, errorRes } = await resendInvitation(user.id, businessId, id);
    if (errorRes) return errorRes;

    // Never expose raw token in production API responses
    const isDev = process.env.NODE_ENV === 'development';
    return successResponse({
      invitation,
      ...(isDev && rawToken ? { rawToken } : {})
    });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[invitations resend POST] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to resend invitation.', 500);
  }
}
