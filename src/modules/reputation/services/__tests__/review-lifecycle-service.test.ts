/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewLifecycleService } from '../review-lifecycle-service';
import { prisma } from '@/lib/db/prisma';
import { AuditService } from '@/lib/audit/audit-service';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reviewRequest: { findUnique: vi.fn(), update: vi.fn() },
    customerFeedback: { findUnique: vi.fn(), update: vi.fn() }
  }
}));

vi.mock('@/lib/audit/audit-service', () => ({
  AuditService: { record: vi.fn() }
}));

describe('ReviewLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canTransition', () => {
    it('allows valid transitions for ReviewRequest', () => {
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'PENDING', 'OPENED')).toBe(true);
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'PENDING', 'COMPLETED')).toBe(true);
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'OPENED', 'COMPLETED')).toBe(true);
    });

    it('rejects invalid transitions for ReviewRequest', () => {
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'COMPLETED', 'OPENED')).toBe(false);
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'CANCELLED', 'PENDING')).toBe(false);
    });

    it('is idempotent for ReviewRequest', () => {
      expect(ReviewLifecycleService.canTransition('ReviewRequest', 'COMPLETED', 'COMPLETED')).toBe(true);
    });

    it('allows valid transitions for CustomerFeedback', () => {
      expect(ReviewLifecycleService.canTransition('CustomerFeedback', 'NEW', 'IN_REVIEW')).toBe(true);
      expect(ReviewLifecycleService.canTransition('CustomerFeedback', 'IN_REVIEW', 'ACTION_REQUIRED')).toBe(true);
      expect(ReviewLifecycleService.canTransition('CustomerFeedback', 'IN_REVIEW', 'RESOLVED')).toBe(true);
    });

    it('rejects invalid transitions for CustomerFeedback', () => {
      expect(ReviewLifecycleService.canTransition('CustomerFeedback', 'RESOLVED', 'NEW')).toBe(false);
      expect(ReviewLifecycleService.canTransition('CustomerFeedback', 'ARCHIVED', 'IN_REVIEW')).toBe(false);
    });
  });

  describe('transitionRequest', () => {
    it('transitions state and sets timestamps', async () => {
      vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue({ id: 'req-1', status: 'PENDING' } as any);
      vi.mocked(prisma.reviewRequest.update).mockResolvedValue({ id: 'req-1', status: 'COMPLETED', completedAt: new Date() } as any);

      await ReviewLifecycleService.transitionRequest('req-1', 'biz-1', 'COMPLETED');

      expect(prisma.reviewRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1', businessId: 'biz-1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date)
          })
        })
      );
    });

    it('throws AppError on invalid transition', async () => {
      vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue({ id: 'req-1', status: 'COMPLETED' } as any);

      await expect(ReviewLifecycleService.transitionRequest('req-1', 'biz-1', 'OPENED')).rejects.toThrow(/Invalid transition/);
    });

    it('returns existing request on idempotent call without db update', async () => {
      const mockReq = { id: 'req-1', status: 'COMPLETED' };
      vi.mocked(prisma.reviewRequest.findUnique).mockResolvedValue(mockReq as any);

      const result = await ReviewLifecycleService.transitionRequest('req-1', 'biz-1', 'COMPLETED');

      expect(result).toEqual(mockReq);
      expect(prisma.reviewRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('transitionFeedback', () => {
    it('transitions state and creates audit log', async () => {
      vi.mocked(prisma.customerFeedback.findUnique).mockResolvedValue({ id: 'fb-1', businessId: 'biz-1', status: 'NEW' } as any);
      vi.mocked(prisma.customerFeedback.update).mockResolvedValue({ id: 'fb-1', businessId: 'biz-1', status: 'IN_REVIEW' } as any);

      await ReviewLifecycleService.transitionFeedback('fb-1', 'biz-1', 'IN_REVIEW', 'user-1');

      expect(prisma.customerFeedback.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fb-1', businessId: 'biz-1' },
          data: { status: 'IN_REVIEW' }
        })
      );
      
      expect(AuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'customer_feedback.updated',
          metadata: { previousState: 'NEW', newState: 'IN_REVIEW' }
        }),
        expect.anything()
      );
    });

    it('sets resolvedAt and resolutionActorId on RESOLVED transition', async () => {
      vi.mocked(prisma.customerFeedback.findUnique).mockResolvedValue({ id: 'fb-1', businessId: 'biz-1', status: 'IN_REVIEW' } as any);
      vi.mocked(prisma.customerFeedback.update).mockResolvedValue({ id: 'fb-1', businessId: 'biz-1', status: 'RESOLVED' } as any);

      await ReviewLifecycleService.transitionFeedback('fb-1', 'biz-1', 'RESOLVED', 'user-2');

      expect(prisma.customerFeedback.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RESOLVED',
            resolvedAt: expect.any(Date),
            resolutionActor: { connect: { id: 'user-2' } }
          })
        })
      );
    });

    it('throws AppError on invalid transition', async () => {
      vi.mocked(prisma.customerFeedback.findUnique).mockResolvedValue({ id: 'fb-1', businessId: 'biz-1', status: 'RESOLVED' } as any);

      await expect(ReviewLifecycleService.transitionFeedback('fb-1', 'biz-1', 'NEW')).rejects.toThrow(/Invalid transition/);
    });
  });
});
