import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';

export async function removeMember(
  actorId: string,
  businessId: string,
  memberId: string
): Promise<{ errorRes: ReturnType<typeof errorResponse> | null }> {
  const member = await prisma.businessMember.findUnique({
    where: { id: memberId },
    include: { rbacRole: true, user: true },
  });

  if (!member || member.businessId !== businessId) {
    return { errorRes: errorResponse('NOT_FOUND', 'Member not found.', 404) };
  }

  // Ownership Rule: OWNER cannot be removed
  if (member.rbacRole?.name === 'OWNER' || member.role === 'OWNER') {
    return {
      errorRes: errorResponse('VALIDATION_ERROR', 'The OWNER cannot be removed from the business.', 400),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessMember.delete({
      where: { id: memberId },
    });

    await tx.auditLog.create({
      data: {
        action: 'member.removed',
        entityType: 'BusinessMember',
        entityId: memberId,
        actorId,
        businessId,
        metadata: {
          removedUserId: member.userId,
          removedUserEmail: member.user.email,
        },
      },
    });
  });

  return { errorRes: null };
}
