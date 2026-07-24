import { withErrorHandling } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ businessId: string; id: string }>;
}

/**
 * DELETE /api/business/[businessId]/invitations/[id]
 * Cancels a pending invitation.
 */
async function DELETE_handler(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, id: invitationId } = await params;

  // Requires 'member.invite' permission to cancel (held by ADMIN and OWNER)
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, businessId },
    });

    if (!invitation) {
      return errorResponse('NOT_FOUND', 'Invitation not found.', 404);
    }

    if (invitation.status !== 'PENDING') {
      return errorResponse('VALIDATION_ERROR', 'Only pending invitations can be cancelled.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: 'CANCELLED' },
      });

      await AuditService.record({
        action: 'invitation.cancelled' as AuditActionType,
        resourceType: 'Invitation' as AuditResourceTypeType,
        resourceId: invitationId,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'invitation.cancelled'}`,
        metadata: { email: invitation.email },
        
      }, tx)
    });

    return successResponse({ success: true }, 200);
  } catch (err) {
    logger.error({ message: 'API Error', context: '[invitations/:id DELETE] Error:', route: 'API' }, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to cancel invitation.', 500);
  }
}

export const DELETE = withErrorHandling(DELETE_handler, 'DELETE /api/business/[businessId]/invitations/[id]');
