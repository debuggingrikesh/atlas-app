import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIService } from '../services/ai-service';
import { GeminiProvider } from '../providers/gemini-provider';
import { prisma } from '@/lib/db/prisma';

vi.mock('../providers/gemini-provider', () => ({
  GeminiProvider: {
    generateJSON: vi.fn(),
  }
}));

vi.mock('@/modules/billing/services/entitlement-service', () => ({
  EntitlementService: {
    canAccessFeature: vi.fn().mockResolvedValue(true),
    getFeatureLimit: vi.fn().mockResolvedValue(100),
  }
}));

vi.mock('@/modules/reputation/services/usage-service', () => ({
  UsageService: {
    checkAndIncrementUsage: vi.fn().mockResolvedValue({ allowed: true }),
  }
}));

vi.mock('@/lib/db/prisma', () => {
  const tx = {
    feedbackAnalysis: { create: vi.fn().mockResolvedValue({ id: 'analysis-1' }) },
    aIUsageLog: { create: vi.fn().mockResolvedValue({ id: 'log-1' }) },
  };
  return {
    prisma: {
      $transaction: vi.fn(async (cb) => {
        return typeof cb === 'function' ? cb(tx) : cb;
      }),
      customerFeedback: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'fb-1',
          businessId: 'biz-1',
          rating: 4,
          comment: 'Good',
          business: { name: 'Test Biz' }
        })
      },
      businessAISettings: {
        findUnique: vi.fn().mockResolvedValue(null)
      },
      businessFeatureUsage: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    }
  };
});

describe('AIService Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compensates usage limit when AI generation fails permanently', async () => {
    vi.mocked(GeminiProvider.generateJSON).mockRejectedValueOnce(new Error('Provider down'));

    await expect(AIService.analyzeFeedback('biz-1', 'fb-1')).resolves.toEqual({
      error: 'Provider down',
      status: 400
    });

    // Check that compensation was called
    expect(prisma.businessFeatureUsage.updateMany).toHaveBeenCalledWith({
      where: { businessId: 'biz-1', feature: 'AI_REPUTATION_ANALYSIS', count: { gt: 0 } },
      data: { count: { decrement: 1 } }
    });
  });

  it('compensates usage limit when AI returns malformed JSON', async () => {
    vi.mocked(GeminiProvider.generateJSON).mockResolvedValueOnce({
      data: { invalid_schema: true },
      usageMetadata: {}
    });

    await expect(AIService.analyzeFeedback('biz-1', 'fb-1')).resolves.toEqual({
      error: expect.stringContaining('invalid_value'), // Zod error from missing keys like 'sentiment'
      status: 400
    });

    // Check that compensation was called
    expect(prisma.businessFeatureUsage.updateMany).toHaveBeenCalledWith({
      where: { businessId: 'biz-1', feature: 'AI_REPUTATION_ANALYSIS', count: { gt: 0 } },
      data: { count: { decrement: 1 } }
    });
  });
});
