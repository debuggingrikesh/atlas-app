 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import type { RoleWithPermissions } from '@/modules/permissions/types';

type CreateRoleOptions = {
  name: string;
  businessId: string;
  isSystem?: boolean;
  permissionKeys?: string[];
  /** actorId is the userId performing the action — required for audit logging */
  actorId: string;
};

/**
 * Creates a Role for a business, optionally assigns named permissions, and
 * emits a `role.created` AuditLog entry — all inside a single transaction.
 *
 * Call only from server-side code after requireAuth() + permission check.
 */
export async function createRole(options: CreateRoleOptions): Promise<RoleWithPermissions> {
  const { name, businessId, isSystem = false, permissionKeys = [], actorId } = options;

  return prisma.$transaction(async (tx) => {
    // 1. Create the role
    const role = await tx.role.create({
      data: {
        name,
        businessId,
        isSystem,
      },
    });

    // 2. Resolve permissions by key and attach them
    let assignedPermissions: { id: string; key: string; description: string | null; category: string | null }[] = [];

    if (permissionKeys.length > 0) {
      const permissions = await tx.permission.findMany({
        where: { key: { in: permissionKeys } },
        select: { id: true, key: true, description: true, category: true },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
          skipDuplicates: true,
        });

        assignedPermissions = permissions;
      }
    }

    // 3. Audit log: role.created
    await AuditService.record({
        action: 'role.created' as AuditActionType,
        resourceType: 'Role' as AuditResourceTypeType,
        resourceId: role.id,
        actorType: 'USER',
        actorUserId: actorId,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'role.created'}`,
        metadata: {
          roleName: name,
          isSystem,
          permissions: permissionKeys,
        },
      
      }, tx)

    return {
      id: role.id,
      name: role.name,
      businessId: role.businessId,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: assignedPermissions,
    };
  });
}
