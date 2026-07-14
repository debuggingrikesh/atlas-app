import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';

export async function cancelInvitation(
  actorId: string,
  businessId: string,
  invitationId: string
): Promise<{ errorRes: ReturnType<typeof errorResponse> | null }> {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.businessId !== businessId) {
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

    await tx.auditLog.create({
      data: {
        action: 'invitation.cancelled',
        entityType: 'Invitation',
        entityId: invitationId,
        actorId,
        businessId,
        metadata: {
          email: invitation.email,
        },
      },
    });
  });

  return { errorRes: null };
}
