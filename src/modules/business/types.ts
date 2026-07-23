/* eslint-disable @typescript-eslint/no-explicit-any */

// Business module types

import type { MemberRole } from '@prisma/client';

export type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  industryTemplateId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Branch = {
  id: string;
  name: string;
  businessId: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BusinessWithMembership = Business & {
  role: MemberRole;
  rbacRole?: { 
    name: string;
    permissions?: { permission: { key: string } }[];
  } | null;
};

export type CreateBusinessInput = {
  name: string;
  industryTemplateId: string;
  description?: string;
};

export type CreateBranchInput = {
  name: string;
  businessId: string;
  address?: string;
};
