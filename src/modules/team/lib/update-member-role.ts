import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import type { MemberRole } from '@prisma/client';
import { createNotification } from '@/modules/notifications/lib/create-notification';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';

export async function updateMemberRole(
  actorId: string,
  businessId: string,
  memberId: string,
  newRoleId: string,
  version?: number
): Promise<{ errorRes: ReturnType<typeof errorResponse> | null }> {
  // 1. Fetch the target member to update
  const targetMember = await prisma.businessMember.findUnique({
    where: {
      id: memberId,
    },
    include: {
      rbacRole: true,
      user: { select: { email: true } },
    },
  });

  if (!targetMember || targetMember.businessId !== businessId) {
    return { errorRes: errorResponse('NOT_FOUND', 'Member not found.', 404) };
  }

  // If role is unchanged, do nothing
  if (targetMember.roleId === newRoleId) {
    return { errorRes: null };
  }

  // 2. Fetch the new role to assign
  const newRole = await prisma.role.findUnique({
    where: { id: newRoleId },
  });

  if (!newRole || newRole.businessId !== businessId) {
    return { errorRes: errorResponse('VALIDATION_ERROR', 'Invalid role specified.', 400) };
  }

  // 3. Fetch the actor's current role to enforce hierarchy
  const actorMember = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: { userId: actorId, businessId },
    },
    include: { rbacRole: true },
  });

  if (!actorMember || !actorMember.rbacRole) {
    return { errorRes: errorResponse('FORBIDDEN', 'Unauthorized.', 403) };
  }

  // If the new role is 'OWNER', the actor must also be an 'OWNER'
  if (newRole.name === 'OWNER' && actorMember.rbacRole.name !== 'OWNER') {
    return {
      errorRes: errorResponse('FORBIDDEN', 'Only existing owners can grant the OWNER role.', 403),
    };
  }

  // 4. Last Owner Standing Check
  // If the target member is currently an OWNER and they are being demoted...
  if (targetMember.rbacRole?.name === 'OWNER') {
    const ownerCount = await prisma.businessMember.count({
      where: {
        businessId,
        rbacRole: { name: 'OWNER' },
      },
    });

    if (ownerCount <= 1) {
      return {
        errorRes: errorResponse(
          'VALIDATION_ERROR',
          'Cannot change the role of the last remaining owner.',
          400
        ),
      };
    }
  }

  // 5. Determine legacy role for dual-write compatibility
  let legacyRole: MemberRole = 'MEMBER';
  if (['OWNER', 'ADMIN', 'MEMBER'].includes(newRole.name)) {
    legacyRole = newRole.name as MemberRole;
  }

  // 6. Execute update and audit log in a transaction
  await prisma.$transaction(async (tx) => {
    const updateCount = await tx.businessMember.updateMany({
      where: { 
        id: memberId,
        ...(version !== undefined && { version })
      },
      data: {
        roleId: newRoleId,
        role: legacyRole,
        version: { increment: 1 },
      },
    });

    if (updateCount.count === 0) {
      throw new Error('409: Conflict. The member was updated by someone else.');
    }

    await AuditService.record({
        action: 'member.role_updated' as AuditActionType,
        resourceType: 'BusinessMember' as AuditResourceTypeType,
        resourceId: memberId,
        actorType: 'USER',
        actorUserId: undefined,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'member.role_updated'}`,
        metadata: {
          previousRole: targetMember.rbacRole?.name || 'UNKNOWN',
          newRole: newRole.name,
          memberEmail: targetMember.user.email,
        },
      
      }, tx)

    await createNotification(
      {
        userId: targetMember.userId,
        businessId,
        type: NOTIFICATION_EVENTS.ROLE_CHANGED,
        title: 'Role Updated',
        message: `Your role has been updated to ${newRole.name}.`,
        metadata: {
          previousRole: targetMember.rbacRole?.name || 'UNKNOWN',
          newRole: newRole.name,
        },
      },
      tx
    );
  });

  return { errorRes: null };
}
