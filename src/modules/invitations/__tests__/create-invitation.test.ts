import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createInvitation } from '../lib/create-invitation';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    role: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1', businessId: 'biz-1', name: 'MEMBER' }) },
    businessMember: { findFirst: vi.fn().mockResolvedValue(null) },
    invitation: { findFirst: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (cb) => {
      const tx = {
        invitation: { create: vi.fn().mockResolvedValue({ id: 'inv-1', email: 'test@example.com' }) },
        userProfile: { findUnique: vi.fn().mockResolvedValue(null) },
        notification: { create: vi.fn().mockResolvedValue({}) },
      };
      return typeof cb === 'function' ? cb(tx) : cb;
    }),
    business: { findUnique: vi.fn().mockResolvedValue({ name: 'Test' }) },
    userProfile: { findUnique: vi.fn().mockResolvedValue({ fullName: 'Admin' }) },
  }
}));

vi.mock('@/lib/audit/audit-service', () => ({
  AuditService: { record: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('@/lib/email/send-email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('createInvitation Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents duplicate invitations for the same email', async () => {
    vi.mocked(prisma.invitation.findFirst).mockResolvedValueOnce({ id: 'inv-1', status: 'PENDING' } as unknown as never);
    
    const result = await createInvitation('user-1', 'biz-1', { email: 'duplicate@test.com', roleId: 'role-1' });
    
    expect(result.errorRes?.status).toBe(400);
  });

  it('prevents inviting an existing member', async () => {
    vi.mocked(prisma.businessMember.findFirst).mockResolvedValueOnce({ id: 'member-1' } as unknown as never);
    
    const result = await createInvitation('user-1', 'biz-1', { email: 'member@test.com', roleId: 'role-1' });
    
    expect(result.errorRes?.status).toBe(400);
  });
});
