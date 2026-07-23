 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';

export async function cancelInvitation(
  actorId: string,
  businessId: string,
  invitationId: string
): Promise<{ errorRes: ReturnType<typeof errorResponse> | null }> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, businessId },
  });

  if (!invitation) {
    return { errorRes: errorResponse('NOT_FOUND', 'Invitation not found.', 404) };
  }

  if (invitation.status !== 'PENDING') {
    return {
      errorRes: errorResponse('VALIDATION_ERROR', 'Only pending invitations can be cancelled.', 400),
    };
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
        actorUserId: actorId,
        businessId: businessId,
        severity: 'INFO',
        summary: `Invitation cancelled for ${invitation.email}`,
        metadata: {
          email: invitation.email,
        },
      
      }, tx)
  });

  return { errorRes: null };
}
