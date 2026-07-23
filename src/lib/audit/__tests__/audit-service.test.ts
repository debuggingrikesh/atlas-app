import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../audit-service';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully creates a persistent audit log with correct fields', async () => {
    await AuditService.record({
      action: 'team.invitation.created',
      resourceType: 'INVITATION',
      resourceId: 'inv-123',
      actorType: 'USER',
      actorUserId: 'usr-123',
      businessId: 'biz-123',
      tenantId: 'biz-123',
      severity: 'INFO',
      summary: 'Test summary',
      requestId: 'req-123',
    });

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'team.invitation.created',
        resourceType: 'INVITATION',
        resourceId: 'inv-123',
        actorType: 'USER',
        actorUserId: 'usr-123',
        businessId: 'biz-123',
        tenantId: 'biz-123',
        requestId: 'req-123',
      }),
    });
  });

  it('redacts sensitive metadata while preserving safe data', async () => {
    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'Settings updated',
      metadata: {
        theme: 'dark',
        userEmail: 'admin@example.com',
        userPassword: 'secretpassword',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        ip_address: '192.168.1.1',
        sessionToken: 'xyz123',
      },
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    expect(metadata.theme).toBe('dark');
    expect(metadata.userEmail).toBe('[REDACTED]');
    expect(metadata.userPassword).toBe('[REDACTED]');
    expect(metadata.customerPhone).toBe('[REDACTED]');
    expect(metadata.customerName).toBe('[REDACTED]');
    expect(metadata.ip_address).toBe('[REDACTED]');
    expect(metadata.sessionToken).toBe('[REDACTED]');
  });

  it('allows business operation to succeed if audit persistence fails when failSilently is true', async () => {
    vi.mocked(prisma.auditEvent.create).mockRejectedValueOnce(new Error('DB Down'));

    // Should not throw
    await expect(
      AuditService.record({
        action: 'team.invitation.resent',
        resourceType: 'INVITATION',
        actorType: 'USER',
        businessId: 'biz-1',
        severity: 'INFO',
        summary: 'Resent',
      })
    ).resolves.not.toThrow();

    expect(logger.error).toHaveBeenCalledWith('Failed to create audit event', expect.objectContaining({
      action: 'team.invitation.resent',
      error: 'DB Down',
    }));
  });

  it('throws and aborts transaction if audit persistence fails when explicitly part of a transaction', async () => {
    const mockTx = {
      auditEvent: {
        create: vi.fn().mockRejectedValue(new Error('Tx Failed')),
      },
    } as unknown as Parameters<typeof AuditService.record>[1];

    await expect(
      AuditService.record({
        action: 'reputation.review_request.created',
        resourceType: 'REVIEW_REQUEST',
        actorType: 'USER',
        businessId: 'biz-1',
        severity: 'INFO',
        summary: 'Created',
      }, mockTx)
    ).rejects.toThrow('Audit event persistence failed for action: reputation.review_request.created');
  });
  it('does not incorrectly redact safe keys containing sensitive substrings', async () => {
    await AuditService.record({
      action: 'reputation.feedback.analyzed',
      resourceType: 'FEEDBACK_ANALYSIS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'analyzed',
      metadata: {
        reviewId: '123',
        feedbackId: '456',
        campaignId: '789',
        email: 'redact@me.com',
      },
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    expect(metadata.reviewId).toBe('123');
    expect(metadata.feedbackId).toBe('456');
    expect(metadata.campaignId).toBe('789');
    expect(metadata.email).toBe('[REDACTED]');
  });

  it('handles array sanitization safely', async () => {
    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'Arrays',
      metadata: {
        users: [{ name: 'safe', email: 'secret@email.com' }],
        emails: ['a@a.com', 'b@b.com'],
      },
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    const users = metadata.users as Array<Record<string, unknown>>;
    expect(users[0].name).toBe('safe');
    expect(users[0].email).toBe('[REDACTED]');
  });

  it('safely handles circular references and depth limits', async () => {
    const circularObj: Record<string, unknown> = { a: 1 };
    circularObj.self = circularObj;

    const deepObj: Record<string, unknown> = { level1: { level2: { level3: { level4: { level5: { level6: { secret: '123' } } } } } } };

    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'circular',
      metadata: {
        circular: circularObj,
        deep: deepObj,
      },
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    const circular = metadata.circular as Record<string, unknown>;
    const deep = metadata.deep as Record<string, unknown>;
    
    expect(circular.self).toBe('[CIRCULAR]');
    
    // Assert depth limit works
    // At depth 6, the value should be [MAX_DEPTH]
    const l1 = deep.level1 as Record<string, unknown>;
    const l2 = l1.level2 as Record<string, unknown>;
    const l3 = l2.level3 as Record<string, unknown>;
    const l4 = l3.level4 as Record<string, unknown>;
    expect(l4.level5).toBe('[MAX_DEPTH]');
  });

  it('does not mutate the original metadata object', async () => {
    const originalMetadata = {
      userEmail: 'test@example.com',
      details: {
        token: 'secret-token'
      }
    };

    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'immutable check',
      metadata: originalMetadata,
    });

    // The original object should remain unchanged
    expect(originalMetadata.userEmail).toBe('test@example.com');
    expect(originalMetadata.details.token).toBe('secret-token');

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    // But the stored object should be redacted
    expect(metadata.userEmail).toBe('[REDACTED]');
    expect((metadata.details as Record<string, unknown>).token).toBe('[REDACTED]');
  });

  it('records actorType dynamically based on userId presence', async () => {
    await AuditService.record({
      action: 'reputation.feedback.analyzed',
      resourceType: 'FEEDBACK_ANALYSIS',
      actorType: 'USER',
      actorUserId: 'u-123',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'actor USER check',
    });

    let callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    expect(callArgs.data.actorType).toBe('USER');
    expect(callArgs.data.actorUserId).toBe('u-123');
    
    vi.clearAllMocks();

    await AuditService.record({
      action: 'reputation.feedback.analyzed',
      resourceType: 'FEEDBACK_ANALYSIS',
      actorType: 'SYSTEM',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'actor SYSTEM check',
    });

    callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    expect(callArgs.data.actorType).toBe('SYSTEM');
    expect(callArgs.data.actorUserId).toBeUndefined();
  });

  it('enforces maximum array length limit', async () => {
    const hugeArray = new Array(150).fill('data');
    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'array limit check',
      metadata: { hugeArray },
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;
    const array = metadata.hugeArray as string[];

    expect(array.length).toBe(101); // 100 elements + sentinel
    expect(array[100]).toBe('[MAX_ARRAY_LENGTH]');
  });

  it('enforces maximum object keys limit', async () => {
    const hugeObject: Record<string, unknown> = {};
    for (let i = 0; i < 150; i++) {
      hugeObject[`key${i}`] = `value${i}`;
    }

    await AuditService.record({
      action: 'business.settings.updated',
      resourceType: 'BUSINESS',
      actorType: 'USER',
      businessId: 'biz-1',
      severity: 'INFO',
      summary: 'object limit check',
      metadata: hugeObject,
    });

    const callArgs = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    const metadata = callArgs.data.metadata as Record<string, unknown>;

    const keys = Object.keys(metadata);
    expect(keys.length).toBe(101); // 100 keys + sentinel
    expect(metadata['[MAX_OBJECT_KEYS]']).toBe('Truncated');
  });
});
