import { ReputationRepository } from '../repositories/reputation-repository';

export interface CampaignMetricsDTO {
  overview: {
    totalRequests: number;
    deliveredRequests: number;
    openedRequests: number;
    expiredRequests: number;
  };
  outcomes: {
    positiveReviews: number;
    negativeFeedback: number;
    reviewConversionRate: number;
  };
  feedback: {
    unresolvedFeedback: number;
    resolvedFeedback: number;
    averageResolutionTime: number; // in hours
  };
  activity: {
    latestRequestCreatedAt: Date | null;
    latestFeedbackCreatedAt: Date | null;
  };
}

export class CampaignMetricsService {
  static async getCampaignMetrics(campaignId: string, businessId: string): Promise<CampaignMetricsDTO> {
    const data = await ReputationRepository.getCampaignMetricAggregates(campaignId, businessId);

    // Overview stats
    let totalRequests = 0;
    let deliveredRequests = 0;
    let openedRequests = 0;
    let expiredRequests = 0;
    let latestRequestCreatedAt: Date | null = null;

    for (const stat of data.requestStats) {
      totalRequests += stat._count;
      
      if (stat.status !== 'CANCELLED') {
        deliveredRequests += stat._count;
      }
      
      if (['OPENED', 'COMPLETED'].includes(stat.status)) {
        openedRequests += stat._count;
      }

      if (stat.status === 'EXPIRED') {
        expiredRequests += stat._count;
      }

      if (stat._max.createdAt) {
        if (!latestRequestCreatedAt || stat._max.createdAt > latestRequestCreatedAt) {
          latestRequestCreatedAt = stat._max.createdAt;
        }
      }
    }

    // Outcomes & Feedback stats
    const threshold = data.settings?.googleRedirectRating ?? 4;
    let positiveReviews = 0;
    let negativeFeedback = 0;
    let unresolvedFeedback = 0;
    let resolvedFeedback = 0;
    let latestFeedbackCreatedAt: Date | null = null;

    for (const stat of data.feedbackStats) {
      if (stat.rating >= threshold) {
        positiveReviews += stat._count;
      } else {
        negativeFeedback += stat._count;
      }

      if (stat.status === 'RESOLVED') {
        resolvedFeedback += stat._count;
      } else if (stat.status !== 'ARCHIVED') {
        unresolvedFeedback += stat._count;
      }

      if (stat._max.createdAt) {
        if (!latestFeedbackCreatedAt || stat._max.createdAt > latestFeedbackCreatedAt) {
          latestFeedbackCreatedAt = stat._max.createdAt;
        }
      }
    }

    // Conversion rate
    const completedOrResponded = positiveReviews + negativeFeedback;
    const reviewConversionRate = deliveredRequests > 0 
      ? Math.round((completedOrResponded / deliveredRequests) * 100) 
      : 0;

    // Average resolution time (hours)
    let averageResolutionTime = 0;
    if (data.resolvedFeedbackTimes.length > 0) {
      let totalHours = 0;
      let validItems = 0;
      for (const f of data.resolvedFeedbackTimes) {
        if (f.resolvedAt) {
          const diffMs = f.resolvedAt.getTime() - f.createdAt.getTime();
          totalHours += diffMs / (1000 * 60 * 60);
          validItems++;
        }
      }
      if (validItems > 0) {
        averageResolutionTime = Math.round((totalHours / validItems) * 10) / 10; // 1 decimal place
      }
    }

    return {
      overview: {
        totalRequests,
        deliveredRequests,
        openedRequests,
        expiredRequests,
      },
      outcomes: {
        positiveReviews,
        negativeFeedback,
        reviewConversionRate,
      },
      feedback: {
        unresolvedFeedback,
        resolvedFeedback,
        averageResolutionTime,
      },
      activity: {
        latestRequestCreatedAt,
        latestFeedbackCreatedAt,
      }
    };
  }
}
