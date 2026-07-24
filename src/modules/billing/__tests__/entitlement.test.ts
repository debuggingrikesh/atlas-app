import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureKeySchema } from '@atlas/core';
import { EntitlementService } from '../services/entitlement-service';
import { SubscriptionService } from '../services/subscription-service';
import { BillingRepository } from '../repositories/billing-repository';

vi.mock('../repositories/billing-repository');
vi.mock('../services/subscription-service');

describe('Entitlement Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Free plan denies AI_REPUTATION_ANALYSIS', async () => {
    vi.mocked(BillingRepository.getActiveSubscription).mockResolvedValue({
      id: 'sub_1',
      businessId: 'biz_1',
      planId: 'plan_free',
      status: 'ACTIVE',
      plan: {
        code: 'FREE',
        name: 'Free Plan',
        features: [
          { featureKey: 'AI_REPUTATION_ANALYSIS', enabled: false, limit: -1 }
        ]
      }
    });

    const canAccess = await EntitlementService.canAccessFeature('biz_1', 'AI_REPUTATION_ANALYSIS');
    expect(canAccess).toBe(false);
  });

  it('Pro plan allows AI_REPUTATION_ANALYSIS', async () => {
    vi.mocked(BillingRepository.getActiveSubscription).mockResolvedValue({
      id: 'sub_2',
      businessId: 'biz_1',
      planId: 'plan_pro',
      status: 'ACTIVE',
      plan: {
        code: 'PRO',
        name: 'Pro Plan',
        features: [
          { featureKey: 'AI_REPUTATION_ANALYSIS', enabled: true, limit: -1 }
        ]
      }
    });

    const canAccess = await EntitlementService.canAccessFeature('biz_1', 'AI_REPUTATION_ANALYSIS');
    expect(canAccess).toBe(true);
  });

  it('Expired or cancelled subscription assigns Free plan', async () => {
    vi.mocked(BillingRepository.getActiveSubscription).mockResolvedValueOnce(null);
    vi.mocked(SubscriptionService.assignFreePlan).mockResolvedValue({
      id: 'sub_new',
      businessId: 'biz_1',
      planId: 'plan_free',
      status: 'ACTIVE',
      plan: {
        code: 'FREE',
        name: 'Free Plan',
        features: [
          { featureKey: FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS, enabled: true, limit: 6 }
        ]
      }
    });

    const limit = await EntitlementService.getFeatureLimit('biz_1', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS);
    expect(SubscriptionService.assignFreePlan).toHaveBeenCalledWith('biz_1');
    expect(limit).toBe(6);
  });

  it('Missing subscription gracefully falls back to default limits if assignment fails', async () => {
    vi.mocked(BillingRepository.getActiveSubscription).mockResolvedValue(null);
    vi.mocked(SubscriptionService.assignFreePlan).mockResolvedValue(null); // Failing assignment

    const limit = await EntitlementService.getFeatureLimit('biz_2', FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS);
    expect(limit).toBe(0); // Safely denied
  });

  it('Missing feature returns 0 limit safely', async () => {
    vi.mocked(BillingRepository.getActiveSubscription).mockResolvedValue({
      id: 'sub_3',
      businessId: 'biz_1',
      planId: 'plan_pro',
      status: 'ACTIVE',
      plan: {
        code: 'PRO',
        name: 'Pro Plan',
        features: [] // Empty
      }
    });

    const limit = await EntitlementService.getFeatureLimit('biz_1', 'SOME_UNKNOWN_FEATURE');
    expect(limit).toBe(0);
  });
});
