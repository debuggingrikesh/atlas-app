import { vi, describe, it, expect, beforeEach } from 'vitest';
import { resendInvitation } from '../lib/resend-invitation';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { logger } from '@/lib/logger';
import { AuditService } from '@/lib/audit/audit-service';
import type { Invitation } from '../types';

vi.mock('@/lib/db/prisma', () => {
  const tx = {
    invitation: { 
      update: vi.fn().mockResolvedValue({ 
        id: 'inv-1', 
        email: 'test@example.com', 
        businessId: 'biz-1', 
        status: 'PENDING',
        role: { name: 'MEMBER' }
      }) 
    }
  };
  return {
    prisma: {
      invitation: { findUnique: vi.fn() },
      $transaction: vi.fn(async (cb) => {
        return typeof cb === 'function' ? cb(tx) : cb;
      }),
      business: { findUnique: vi.fn().mockResolvedValue({ name: 'Test Business' }) },
      userProfile: { findUnique: vi.fn().mockResolvedValue({ fullName: 'Inviter User' }) },
    }
  };
});

vi.mock('@/lib/audit/audit-service', () => ({
  AuditService: { record: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('@/lib/email/send-email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('resendInvitation Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully resends a valid pending invitation', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'PENDING'
    } as unknown as never);

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    expect(result.errorRes).toBeNull();
    expect(result.invitation).toBeDefined();
    expect(result.rawToken).toBeDefined();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(AuditService.record).toHaveBeenCalledTimes(1);
  });

  it('fails safely and recovers when email provider fails', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'PENDING'
    } as unknown as never);
    
    vi.mocked(sendEmail).mockResolvedValueOnce({ success: false, error: 'Network Error' });

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    // Returns 500 but still preserves the updated invitation data
    expect(result.errorRes?.status).toBe(500);
    expect(result.invitation).toBeDefined();
    expect(result.rawToken).toBeNull();
    // Verify it doesn't crash
  });

  it('maintains idempotency across repeated manual resend attempts', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'PENDING'
    } as unknown as never);
    
    await resendInvitation('user-1', 'biz-1', 'inv-1');
    await resendInvitation('user-1', 'biz-1', 'inv-1');

    // Email called exactly twice (once per manual request)
    expect(sendEmail).toHaveBeenCalledTimes(2);
    // Transaction called exactly twice, updating the single row, not creating duplicates
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('returns a safe error when invitation is not found', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce(null as unknown as never);

    const result = await resendInvitation('user-1', 'biz-1', 'inv-missing');
    
    expect(result.errorRes?.status).toBe(404);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects resend for invalid status (ACCEPTED)', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'ACCEPTED'
    } as unknown as never);

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    expect(result.errorRes?.status).toBe(400);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refreshes and resends an EXPIRED invitation', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'EXPIRED'
    } as unknown as never);

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    expect(result.errorRes).toBeNull();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('fails authorization if cross-tenant actor tries to resend', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-2', // Different business
      email: 'test@example.com',
      status: 'PENDING'
    } as unknown as never);

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    expect(result.errorRes?.status).toBe(404);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('preserves privacy by not logging email address on unexpected error', async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({ 
      id: 'inv-1', 
      businessId: 'biz-1', 
      email: 'test@example.com',
      status: 'PENDING'
    } as unknown as never);
    
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Unknown Failure'));

    const result = await resendInvitation('user-1', 'biz-1', 'inv-1');
    
    expect(result.errorRes?.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalledWith(expect.objectContaining({ email: expect.anything() }));
    expect(logger.error).not.toHaveBeenCalledWith(expect.objectContaining({ token: expect.anything() }));
  });
});
