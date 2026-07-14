import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import type { BusinessWithMembership } from '@/modules/business/types';

/**
 * Verifies that the authenticated user holds a Role within the given business
 * that carries the requested permission key.
 *
 * This reads through the RBAC path:
 *   BusinessMember.roleId → Role → RolePermission → Permission.key
 *
 * If the user has no RBAC role assigned (roleId is null — possible during the
 * dual-write transition period), this function falls back to legacy MEMBER/ADMIN/OWNER roles.
 *
 * Usage in API route handlers:
 *   const { errorRes } = await requirePermission(userId, businessId, 'business.update');
 *   if (errorRes) return errorRes;
 */
export async function requirePermission(
  userId: string,
  businessId: string,
  permissionKey: string
): Promise<{ errorRes: null } | { errorRes: ReturnType<typeof errorResponse> }> {
  const membership = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
    select: {
      role: true,
      business: { select: { deletedAt: true } },
      rbacRole: {
        select: {
          name: true,
          permissions: {
            select: { permission: { select: { key: true } } },
          },
        },
      },
    },
  });

  // Not a member or business is deleted
  if (!membership || membership.business.deletedAt) {
    return {
      errorRes: errorResponse('NOT_FOUND', 'Business not found.', 404),
    };
  }

  // Map to BusinessWithMembership shape to reuse the resolver
  const mockMembership = {
    role: membership.role,
    rbacRole: membership.rbacRole,
  };

  const perms = resolvePermissions(mockMembership as BusinessWithMembership);

  if (!perms.hasPermission(permissionKey)) {
    return {
      errorRes: errorResponse(
        'FORBIDDEN',
        'You do not have permission to perform this action.',
        403
      ),
    };
  }

  return { errorRes: null };
}
