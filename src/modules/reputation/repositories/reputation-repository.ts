 

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { FeatureKeySchema } from '@atlas/core';

export class ReputationRepository {
  // ──────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────
  static async getSettings(businessId: string) {
    return prisma.reputationSettings.findFirst({
      where: { businessId },
    });
  }

  static async updateSettings(businessId: string, data: Prisma.ReputationSettingsUpdateInput) {
    // Upsert since settings might be created lazily
    const existing = await this.getSettings(businessId);
    
    if (existing) {
      return prisma.reputationSettings.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.reputationSettings.create({
      data: {
        ...(data as Omit<Prisma.ReputationSettingsUncheckedCreateInput, 'businessId'>),
        businessId,
      },
    });
  }

  // ──────────────────────────────────────────
  // Campaigns
  // ──────────────────────────────────────────
  static async createCampaign(data: Prisma.ReviewCampaignUncheckedCreateInput) {
    return prisma.reviewCampaign.create({ data });
  }

  static async getCampaigns(businessId: string) {
    return prisma.reviewCampaign.findMany({
      where: { businessId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCampaignById(id: string, businessId: string) {
    return prisma.reviewCampaign.findFirst({
      where: { id, businessId, archivedAt: null },
    });
  }

  static async getCampaignByPublicId(publicId: string) {
    return prisma.reviewCampaign.findFirst({
      where: { publicId, archivedAt: null },
      include: {
        business: {
          select: { name: true, logoUrl: true }
        }
      }
    });
  }

  static async updateCampaign(id: string, businessId: string, data: Prisma.ReviewCampaignUncheckedUpdateInput) {
    return prisma.reviewCampaign.updateMany({
      where: { id, businessId, archivedAt: null },
      data,
    });
  }

  // ──────────────────────────────────────────
  // Review Requests
  // ──────────────────────────────────────────
  static async createReviewRequest(
    data: Prisma.ReviewRequestUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma
  ) {
    return tx.reviewRequest.create({ data });
  }

  static async getRequestByToken(token: string) {
    return prisma.reviewRequest.findUnique({
      where: { token },
      include: {
        business: {
          select: { name: true, logoUrl: true }
        },
        campaign: {
          select: { name: true, googleReviewUrl: true }
        }
      }
    });
  }

  // ──────────────────────────────────────────
  // Feedback
  // ──────────────────────────────────────────
  static async createFeedback(
    data: Prisma.CustomerFeedbackUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma
  ) {
    return tx.customerFeedback.create({ data });
  }

  static async getFeedback(businessId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      prisma.customerFeedback.findMany({
        where: { businessId },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customerFeedback.count({
        where: { businessId }
      })
    ]);

    return { data, total, page, limit };
  }

  static async getCampaignsWithCounts(businessId: string) {
    return prisma.reviewCampaign.findMany({
      where: { businessId, archivedAt: null },
      include: {
        branch: { select: { name: true } },
        _count: { select: { requests: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getReviewRequests(businessId: string) {
    return prisma.reviewRequest.findMany({
      where: { businessId },
      include: {
        campaign: { select: { name: true } },
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getOverviewStats(businessId: string) {
    const settings = await this.getSettings(businessId);
    const googleRedirectRating = settings?.googleRedirectRating ?? 4;

    const [
      totalRequests,
      openedRequests,
      completedRequests,
      positiveFeedback,
      privateFeedbackCount,
      usage
    ] = await Promise.all([
      // Total requests sent
      prisma.reviewRequest.count({ where: { businessId } }),
      // Opened requests (status OPENED or COMPLETED)
      prisma.reviewRequest.count({
        where: {
          businessId,
          status: { in: ['OPENED', 'COMPLETED'] }
        }
      }),
      // Completed requests
      prisma.reviewRequest.count({ where: { businessId, status: 'COMPLETED' } }),
      // Positive feedback (rating >= threshold)
      prisma.customerFeedback.count({
        where: {
          businessId,
          rating: { gte: googleRedirectRating }
        }
      }),
      // Private feedback requiring attention (status UNREAD)
      prisma.customerFeedback.count({
        where: {
          businessId,
          status: 'UNREAD'
        }
      }),
      // Feature usage
      prisma.businessFeatureUsage.findUnique({
        where: {
          businessId_feature: {
            businessId,
            feature: FeatureKeySchema.enum.REPUTATION_REVIEW_REQUESTS
          }
        }
      })
    ]);

    return {
      totalRequests,
      openedRequests,
      completedRequests,
      positiveFeedback,
      privateFeedbackCount,
      usage: {
        count: usage?.count ?? 0,
        limit: usage?.limit ?? 6
      }
    };
  }

  // ──────────────────────────────────────────
  // Metrics
  // ──────────────────────────────────────────
  static async getCampaignMetricAggregates(campaignId: string, businessId: string) {
    const settings = await this.getSettings(businessId);
    
    // Group by status for requests
    const requestStats = await prisma.reviewRequest.groupBy({
      by: ['status'],
      where: { campaignId, businessId },
      _count: true,
      _max: { createdAt: true }
    });

    // Group by rating and status for feedback
    const feedbackStats = await prisma.customerFeedback.groupBy({
      by: ['rating', 'status'],
      where: { request: { campaignId, businessId } },
      _count: true,
      _max: { createdAt: true }
    });

    // Fetch dates for resolution time average
    const resolvedFeedbackTimes = await prisma.customerFeedback.findMany({
      where: { request: { campaignId, businessId }, status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    });

    return {
      requestStats,
      feedbackStats,
      resolvedFeedbackTimes,
      settings
    };
  }
}
