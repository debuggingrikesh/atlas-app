import { logger } from '@/lib/logger';
 

import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { cancelInvitation } from '@/modules/invitations/lib/cancel-invitation';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/invitations/[id]
 * Cancels a pending invitation.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // We need to look up the invitation to find its businessId to authorize
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { businessId: true },
  });

  if (!invitation) {
    return errorResponse('NOT_FOUND', 'Invitation not found.', 404);
  }

  const { errorRes: permError } = await requirePermission(
    user.id,
    invitation.businessId,
    PERMISSIONS.member.remove
  );
  if (permError) return permError;

  try {
    const { errorRes } = await cancelInvitation(user.id, invitation.businessId, id);
    if (errorRes) return errorRes;

    return successResponse({ success: true });
  } catch (err) {
    logger.error({ message: 'API Error', context: '[invitations DELETE] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to cancel invitation.', 500);
  }
}
