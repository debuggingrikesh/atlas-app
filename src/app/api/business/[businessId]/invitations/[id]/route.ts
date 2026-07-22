import { AuditService } from '@/lib/audit/audit-service';
import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@atlas/core/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: Promise<{ businessId: string; id: string }>;
}

/**
 * DELETE /api/business/[businessId]/invitations/[id]
 * Cancels a pending invitation.
 */
export async function DELETE(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, id: invitationId } = await params;

  // Requires 'member.invite' permission to cancel (held by ADMIN and OWNER)
  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.member.invite);
  if (permError) return permError;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.businessId !== businessId) {
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
        action: 'invitation.cancelled' as any,
        resourceType: 'Invitation' as any,
        resourceId: invitationId,
        actorType: 'USER',
        actorUserId: user.id,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'invitation.cancelled'}`,
        metadata: { email: invitation.email },
        
      }, tx)
    });

    return successResponse({ success: true }, 200);
  } catch (err) {
    console.error('[invitations/:id DELETE] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to cancel invitation.', 500);
  }
}
