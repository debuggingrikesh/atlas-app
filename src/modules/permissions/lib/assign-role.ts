import { prisma } from '@/lib/db/prisma';
import { createNotification } from '@/modules/notifications/lib/create-notification';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';

type AssignRoleOptions = {
  /** The BusinessMember.id to update */
  memberId: string;
  /** The new Role.id */
  roleId: string;
  businessId: string;
  /** userId of the actor performing the change */
  actorId: string;
};

/**
 * Assigns an RBAC Role to a BusinessMember by updating `roleId` and
 * emits `permission.assigned` + `member.role.updated` audit events
 * inside a single transaction.
 *
 * This does NOT touch the legacy `role` enum column — it only sets `roleId`.
 */
export async function assignRole(options: AssignRoleOptions): Promise<void> {
  const { memberId, roleId, businessId, actorId } = options;

  await prisma.$transaction(async (tx) => {
    // 1. Fetch current state for the audit diff
    const current = await tx.businessMember.findUnique({
      where: { id: memberId },
      select: { roleId: true, userId: true },
    });

    if (!current) {
      throw new Error(`BusinessMember ${memberId} not found.`);
    }

    // 2. Fetch the new role name for audit metadata
    const newRole = await tx.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });

    if (!newRole) {
      throw new Error(`Role ${roleId} not found.`);
    }

    // 3. Apply the new roleId
    await tx.businessMember.update({
      where: { id: memberId },
      data: { roleId },
    });

    // 4. Audit: permission.assigned
    await tx.auditLog.create({
      data: {
        action: 'permission.assigned',
        entityType: 'BusinessMember',
        entityId: memberId,
        actorId,
        businessId,
        metadata: {
          previousRoleId: current.roleId,
          newRoleId: roleId,
          newRoleName: newRole.name,
          targetUserId: current.userId,
        },
      },
    });

    // 5. Audit: member.role.updated
    await tx.auditLog.create({
      data: {
        action: 'member.role.updated',
        entityType: 'BusinessMember',
        entityId: memberId,
        actorId,
        businessId,
        metadata: {
          previousRoleId: current.roleId,
          newRoleId: roleId,
          newRoleName: newRole.name,
          targetUserId: current.userId,
        },
      },
    });

    // 6. Notify the affected member
    // Check to prevent notifying the user if they are changing their own role (though usually blocked by UI/API rules)
    if (current.userId !== actorId) {
      await createNotification(
        {
          userId: current.userId,
          businessId,
          type: NOTIFICATION_EVENTS.ROLE_CHANGED,
          title: 'Role Updated',
          message: `Your role has been updated to ${newRole.name}.`,
          metadata: { newRoleName: newRole.name, previousRoleId: current.roleId, newRoleId: roleId },
        },
        tx
      );
    }
  });
}
