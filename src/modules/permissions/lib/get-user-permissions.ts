import { prisma } from '@/lib/db/prisma';
import type { Permission } from '@/modules/permissions/types';

/**
 * Returns all permissions assigned to the user's RBAC Role within a specific
 * business. Returns an empty array if the user has no membership or no roleId.
 *
 * This function reads through:
 *   BusinessMember → rbacRole → RolePermission → Permission
 */
export async function getUserPermissions(
  userId: string,
  businessId: string
): Promise<Permission[]> {
  const membership = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
    select: {
      rbacRole: {
        select: {
          permissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  key: true,
                  description: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership?.rbacRole) return [];

  return membership.rbacRole.permissions.map((rp) => rp.permission);
}
