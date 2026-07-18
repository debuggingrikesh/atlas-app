import type { BusinessWithMembership } from '@/modules/business/types';
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_MEMBER_PERMISSIONS } from './system-roles';

export type ResolvedPermissions = {
  role: string;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
};

/**
 * The single permission calculation source for Atlas.
 */
export function resolvePermissions(
  membership: BusinessWithMembership | null | undefined
): ResolvedPermissions {
  if (!membership) {
    return {
      role: 'NONE',
      isOwner: false,
      isAdmin: false,
      isMember: false,
      permissions: [],
      hasPermission: () => false,
    };
  }

  const roleName = membership.rbacRole?.name || membership.role || 'MEMBER';
  const isOwner = roleName === 'OWNER';
  const isAdmin = roleName === 'ADMIN';
  const isMember = roleName === 'MEMBER'; // Explicit MEMBER role

  // DB-assigned permissions
  const assignedPermissions = membership.rbacRole?.permissions?.map((p) => p.permission.key) || [];
  
  const permissionSet = new Set<string>(assignedPermissions);

  if (isAdmin) {
    DEFAULT_ADMIN_PERMISSIONS.forEach((p) => permissionSet.add(p));
  } else if (isMember) {
    DEFAULT_MEMBER_PERMISSIONS.forEach((p) => permissionSet.add(p));
  }

  const permissions = Array.from(permissionSet);

  return {
    role: roleName,
    isOwner,
    isAdmin,
    isMember,
    permissions,
    hasPermission: (permission: string) => {
      // OWNER automatically receives all permissions.
      if (isOwner) return true;
      return permissionSet.has(permission);
    },
  };
}
