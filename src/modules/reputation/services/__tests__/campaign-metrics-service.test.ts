import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignMetricsService } from '../campaign-metrics-service';
import { ReputationRepository } from '../../repositories/reputation-repository';

vi.mock('../../repositories/reputation-repository', () => ({
  ReputationRepository: {
    getCampaignMetricAggregates: vi.fn(),
  },
}));

describe('CampaignMetricsService', () => {
  const campaignId = 'test-campaign';
  const businessId = 'test-business';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates metrics correctly for zero activity', async () => {
    vi.mocked(ReputationRepository.getCampaignMetricAggregates).mockResolvedValue({
      requestStats: [],
      feedbackStats: [],
      resolvedFeedbackTimes: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: { googleRedirectRating: 4 } as any,
    });

    const metrics = await CampaignMetricsService.getCampaignMetrics(campaignId, businessId);

    expect(metrics.overview.totalRequests).toBe(0);
    expect(metrics.overview.deliveredRequests).toBe(0);
    expect(metrics.overview.openedRequests).toBe(0);
    expect(metrics.outcomes.positiveReviews).toBe(0);
    expect(metrics.outcomes.reviewConversionRate).toBe(0);
    expect(metrics.feedback.unresolvedFeedback).toBe(0);
    expect(metrics.feedback.averageResolutionTime).toBe(0);
  });

  it('calculates metrics for an active campaign', async () => {
    const now = new Date();
    vi.mocked(ReputationRepository.getCampaignMetricAggregates).mockResolvedValue({
      requestStats: [
        { status: 'OPENED', _count: 10, _max: { createdAt: now } },
        { status: 'PENDING', _count: 20, _max: { createdAt: new Date(now.getTime() - 1000) } },
        { status: 'CANCELLED', _count: 5, _max: { createdAt: new Date(now.getTime() - 2000) } },
      ],
      feedbackStats: [
        { rating: 5, status: 'RESOLVED', _count: 4, _max: { createdAt: now } },
        { rating: 3, status: 'NEW', _count: 2, _max: { createdAt: new Date(now.getTime() - 1000) } },
      ],
      resolvedFeedbackTimes: [
        { createdAt: new Date(now.getTime() - 10 * 36e5), resolvedAt: now }, // 10 hours
        { createdAt: new Date(now.getTime() - 5 * 36e5), resolvedAt: now },  // 5 hours
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: null as any, // fallback to 4
    });

    const metrics = await CampaignMetricsService.getCampaignMetrics(campaignId, businessId);

    expect(metrics.overview.totalRequests).toBe(35); // 10 + 20 + 5
    expect(metrics.overview.deliveredRequests).toBe(30); // 10 + 20
    expect(metrics.overview.openedRequests).toBe(10);
    expect(metrics.overview.expiredRequests).toBe(0);

    expect(metrics.outcomes.positiveReviews).toBe(4);
    expect(metrics.outcomes.negativeFeedback).toBe(2);
    // conversion rate = (4 + 2) / 30 = 20%
    expect(metrics.outcomes.reviewConversionRate).toBe(20);

    expect(metrics.feedback.unresolvedFeedback).toBe(2);
    expect(metrics.feedback.resolvedFeedback).toBe(4);
    // average resolution = (10 + 5) / 2 = 7.5
    expect(metrics.feedback.averageResolutionTime).toBe(7.5);
    
    expect(metrics.activity.latestRequestCreatedAt).toBe(now);
    expect(metrics.activity.latestFeedbackCreatedAt).toBe(now);
  });

  it('calculates metrics for an expired campaign', async () => {
    vi.mocked(ReputationRepository.getCampaignMetricAggregates).mockResolvedValue({
      requestStats: [
        { status: 'EXPIRED', _count: 50, _max: { createdAt: new Date() } },
      ],
      feedbackStats: [],
      resolvedFeedbackTimes: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: { googleRedirectRating: 5 } as any,
    });

    const metrics = await CampaignMetricsService.getCampaignMetrics(campaignId, businessId);

    expect(metrics.overview.totalRequests).toBe(50);
    expect(metrics.overview.deliveredRequests).toBe(50);
    expect(metrics.overview.expiredRequests).toBe(50);
    expect(metrics.outcomes.reviewConversionRate).toBe(0);
  });

  it('handles negative feedback with custom threshold', async () => {
    vi.mocked(ReputationRepository.getCampaignMetricAggregates).mockResolvedValue({
      requestStats: [
        { status: 'COMPLETED', _count: 2, _max: { createdAt: new Date() } }
      ],
      feedbackStats: [
        { rating: 4, status: 'UNREAD', _count: 1, _max: { createdAt: new Date() } }, // Should be negative if threshold is 5
        { rating: 5, status: 'RESOLVED', _count: 1, _max: { createdAt: new Date() } }, // Positive
      ],
      resolvedFeedbackTimes: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: { googleRedirectRating: 5 } as any, // Custom threshold!
    });

    const metrics = await CampaignMetricsService.getCampaignMetrics(campaignId, businessId);

    expect(metrics.outcomes.positiveReviews).toBe(1);
    expect(metrics.outcomes.negativeFeedback).toBe(1);
    expect(metrics.outcomes.reviewConversionRate).toBe(100);
  });
});
