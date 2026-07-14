import { requireAuth } from '@/lib/auth/require-auth';
import { requirePermission } from '@/lib/auth/require-permission';
import { successResponse, errorResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { PERMISSIONS } from '@/lib/permissions/permissions';

interface Params {
  params: Promise<{ businessId: string; roleId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, roleId } = await params;

  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.role.manage);
  if (permError) return permError;

  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: { select: { key: true } } } },
      }
    });

    if (!role || role.businessId !== businessId) {
      return errorResponse('NOT_FOUND', 'Role not found.', 404);
    }

    if (role.name === 'OWNER') {
      return errorResponse('FORBIDDEN', 'OWNER permissions cannot be modified.', 403);
    }

    if (role.isSystem && name && name !== role.name) {
      return errorResponse('FORBIDDEN', 'System role names cannot be modified.', 403);
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update name/description
      const updated = await tx.role.update({
        where: { id: roleId },
        data: {
          ...(name && !role.isSystem ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });

      // Update permissions if provided
      if (Array.isArray(permissions)) {
        const dbPermissions = await tx.permission.findMany({
          where: { key: { in: permissions } },
          select: { id: true, key: true },
        });

        await tx.rolePermission.deleteMany({ where: { roleId } });

        if (dbPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: dbPermissions.map((p) => ({
              roleId,
              permissionId: p.id,
            })),
          });
        }

        const oldPerms = role.permissions.map((rp) => rp.permission.key);
        const newPerms = dbPermissions.map((p) => p.key);

        const added = newPerms.filter((p) => !oldPerms.includes(p));
        const removed = oldPerms.filter((p) => !newPerms.includes(p));

        if (added.length > 0 || removed.length > 0) {
          await tx.auditLog.create({
            data: {
              action: 'role.permissions_updated',
              entityType: 'Role',
              entityId: roleId,
              actorId: user.id,
              businessId,
              metadata: { roleName: updated.name, added, removed },
            },
          });
        }
      }

      return updated;
    });

    return successResponse({ role: updatedRole });
  } catch (err) {
    console.error('[roles PATCH] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update role.', 500);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { user, errorRes: authError } = await requireAuth();
  if (authError) return authError;

  const { businessId, roleId } = await params;

  const { errorRes: permError } = await requirePermission(user.id, businessId, PERMISSIONS.role.manage);
  if (permError) return permError;

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        members: { select: { userId: true } },
      }
    });

    if (!role || role.businessId !== businessId) {
      return errorResponse('NOT_FOUND', 'Role not found.', 404);
    }

    if (role.isSystem) {
      return errorResponse('FORBIDDEN', 'Cannot delete system roles.', 403);
    }

    // Find the default MEMBER role to fall back to
    const memberRole = await prisma.role.findUnique({
      where: { businessId_name: { businessId, name: 'MEMBER' } },
    });

    if (!memberRole) {
      return errorResponse('INTERNAL_ERROR', 'System MEMBER role not found.', 500);
    }

    await prisma.$transaction(async (tx) => {
      const affectedUserIds = role.members.map((m) => m.userId);

      if (affectedUserIds.length > 0) {
        // Move members to MEMBER role
        await tx.businessMember.updateMany({
          where: { roleId },
          data: {
            roleId: memberRole.id,
            role: 'MEMBER',
          },
        });

        // Notify affected users
        if (affectedUserIds.length > 0) {
          await tx.notification.createMany({
            data: affectedUserIds.map((userId) => ({
              userId,
              businessId,
              type: 'role.deleted',
              title: 'Role Removed',
              message: `Your previous role "${role.name}" was removed. You have been moved to MEMBER.`,
              metadata: { oldRole: role.name, newRole: 'MEMBER' },
            })),
          });
        }
      }

      await tx.role.delete({
        where: { id: roleId },
      });

      await tx.auditLog.create({
        data: {
          action: 'role.deleted',
          entityType: 'Role',
          entityId: roleId,
          actorId: user.id,
          businessId,
          metadata: { name: role.name, usersMoved: role.members.length },
        },
      });
    });

    return successResponse({ success: true });
  } catch (err) {
    console.error('[roles DELETE] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete role.', 500);
  }
}
