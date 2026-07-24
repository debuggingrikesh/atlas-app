import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureKeySchema } from '@atlas/core';
import { UsageService } from '../services/usage-service';

describe('Usage Enforcement', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockTx: any = {
    businessFeatureUsage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows usage when within limit', async () => {
    mockTx.businessFeatureUsage.findUnique.mockResolvedValue({ id: '1', limit: 6 });
    mockTx.businessFeatureUsage.updateMany.mockResolvedValue({ count: 1 }); // 1 row updated

    const result = await UsageService.checkAndIncrementUsage('biz_1', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS, 6, mockTx);
    expect(result.allowed).toBe(true);
    expect(mockTx.businessFeatureUsage.updateMany).toHaveBeenCalledWith({
      where: {
        businessId: 'biz_1',
        feature: FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS,
        count: { lt: 6 }
      },
      data: { count: { increment: 1 } }
    });
  });

  it('denies usage when quota exceeded', async () => {
    mockTx.businessFeatureUsage.findUnique.mockResolvedValue({ id: '1', limit: 6 });
    mockTx.businessFeatureUsage.updateMany.mockResolvedValue({ count: 0 }); // 0 rows updated

    const result = await UsageService.checkAndIncrementUsage('biz_1', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS, 6, mockTx);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('PAYMENT_REQUIRED');
  });

  it('lazily creates usage tracking if it does not exist', async () => {
    mockTx.businessFeatureUsage.findUnique.mockResolvedValue(null);
    mockTx.businessFeatureUsage.create.mockResolvedValue({ id: '1' });

    const result = await UsageService.checkAndIncrementUsage('biz_1', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS, 6, mockTx);
    expect(result.allowed).toBe(true);
    expect(mockTx.businessFeatureUsage.create).toHaveBeenCalledWith({
      data: {
        businessId: 'biz_1',
        feature: FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS,
        limit: 6,
        count: 1
      }
    });
  });

  it('syncs limits if plan changes', async () => {
    mockTx.businessFeatureUsage.findUnique.mockResolvedValue({ id: '1', limit: 6 });
    mockTx.businessFeatureUsage.updateMany.mockResolvedValue({ count: 1 });

    await UsageService.checkAndIncrementUsage('biz_1', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS, 10, mockTx);

    expect(mockTx.businessFeatureUsage.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { limit: 10 }
    });
  });
});
