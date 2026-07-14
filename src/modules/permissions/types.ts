// Permissions module types

export type Permission = {
  id: string;
  key: string;
  description: string | null;
  category: string | null;
};

export type Role = {
  id: string;
  name: string;
  businessId: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type CreateRoleInput = {
  name: string;
  businessId: string;
  isSystem?: boolean;
  permissionKeys?: string[];
};

export type AssignRoleInput = {
  memberId: string;
  roleId: string;
  businessId: string;
};
