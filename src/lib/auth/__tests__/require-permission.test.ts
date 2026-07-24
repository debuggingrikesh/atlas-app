import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePermission } from '../require-permission';
import { prisma } from '@/lib/db/prisma';
import { PERMISSIONS } from '@atlas/core';
import type { Prisma } from '@prisma/client';

type MockMembership = Prisma.BusinessMemberGetPayload<{
  include: {
    business: true;
    rbacRole: {
      include: { permissions: { include: { permission: true } } }
    };
  }
}>;

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    businessMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe('requirePermission', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects if member is not found (Authentication / Membership)', async () => {
    vi.mocked(prisma.businessMember.findUnique).mockResolvedValueOnce(null);

    const result = await requirePermission('user-1', 'biz-1', PERMISSIONS.business.update);
    expect(result.errorRes).not.toBeNull();
    const response = await result.errorRes;
    expect(response?.status).toBe(404);
    const json = await response?.json();
    expect(json.error.message).toBe('Business not found.');
  });

  it('allows access for OWNER without checking specific role permissions (Privilege Escalation)', async () => {
    vi.mocked(prisma.businessMember.findUnique).mockResolvedValueOnce({
      id: 'member-1',
      userId: 'user-1',
      businessId: 'biz-1',
      role: 'OWNER',
      roleId: 'role-owner',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      business: { deletedAt: null },
      rbacRole: {
        id: 'role-owner',
        name: 'OWNER',
        businessId: 'biz-1',
        description: '',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [] // no specific permissions needed for owner
      }
    } as unknown as MockMembership);

    const result = await requirePermission('user-1', 'biz-1', PERMISSIONS.business.update);
    expect(result.errorRes).toBeNull();
  });

  it('rejects if role lacks required permission (IDOR / Privilege)', async () => {
    vi.mocked(prisma.businessMember.findUnique).mockResolvedValueOnce({
      id: 'member-1',
      userId: 'user-1',
      businessId: 'biz-1',
      role: 'MEMBER',
      roleId: 'role-member',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      business: { deletedAt: null },
      rbacRole: {
        id: 'role-member',
        name: 'MEMBER',
        businessId: 'biz-1',
        description: '',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
          { permission: { key: PERMISSIONS.reputation.view } }
        ]
      }
    } as unknown as MockMembership);

    const result = await requirePermission('user-1', 'biz-1', PERMISSIONS.business.update);
    expect(result.errorRes).not.toBeNull();
    const response = await result.errorRes;
    expect(response?.status).toBe(403);
    const json = await response?.json();
    expect(json.error.message).toBe('You do not have permission to perform this action.');
  });

  it('allows access if role has required permission', async () => {
    vi.mocked(prisma.businessMember.findUnique).mockResolvedValueOnce({
      id: 'member-1',
      userId: 'user-1',
      businessId: 'biz-1',
      role: 'MEMBER',
      roleId: 'role-member',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      business: { deletedAt: null },
      rbacRole: {
        id: 'role-member',
        name: 'MEMBER',
        businessId: 'biz-1',
        description: '',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
          { permission: { key: PERMISSIONS.reputation.view } },
          { permission: { key: PERMISSIONS.reputation.manage } }
        ]
      }
    } as unknown as MockMembership);

    const result = await requirePermission('user-1', 'biz-1', PERMISSIONS.reputation.manage);
    expect(result.errorRes).toBeNull();
  });
});
