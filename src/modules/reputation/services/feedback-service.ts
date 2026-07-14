import { prisma } from '@/lib/db/prisma';
import { ReputationRepository } from '../repositories/reputation-repository';
import { ReputationSettingsService } from './reputation-settings-service';

export class FeedbackService {
  static async getFeedback(businessId: string, page: number, limit: number) {
    return ReputationRepository.getFeedback(businessId, page, limit);
  }

  static async getReviewRequestDetails(token: string) {
    const request = await ReputationRepository.getRequestByToken(token);
    
    if (!request) {
      return { error: 'Invalid or expired review token.', status: 404 };
    }

    if (request.status !== 'PENDING') {
      return { error: 'This review request has already been processed.', status: 400 };
    }

    const expiresAt = new Date(request.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > expiresAt) {
      return { error: 'This review request has expired.', status: 400 };
    }

    return { request };
  }

  static async submitPublicReview(token: string, data: {
    rating: number;
    comment?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) {
    // 1. Find request
    const request = await ReputationRepository.getRequestByToken(token);
    
    if (!request) {
      return { error: 'Invalid or expired review token.', status: 404 };
    }

    // 2. Verify status and expiry (+30 days)
    if (request.status !== 'PENDING') {
      return { error: 'This review request has already been processed.', status: 400 };
    }

    const expiresAt = new Date(request.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > expiresAt) {
      return { error: 'This review request has expired.', status: 400 };
    }

    // 3. Load settings
    const settings = await ReputationSettingsService.getSettings(request.businessId);

    // 4. Determine feedback status and action based on threshold
    const isPositive = data.rating >= settings.googleRedirectRating;
    const feedbackStatus = isPositive ? 'REDIRECTED' : 'UNREAD';
    const actionResult = isPositive
      ? { action: 'GOOGLE_REDIRECT', redirectUrl: request.campaign.googleReviewUrl }
      : { action: 'INTERNAL_FEEDBACK_SAVED' };

    // 5. Persist feedback and mark request as COMPLETED in a single transaction
    try {
      await prisma.$transaction(async (tx) => {
        await ReputationRepository.createFeedback({
          businessId: request.businessId,
          branchId: request.branchId,
          requestId: request.id,
          rating: data.rating,
          comment: data.comment,
          customerName: data.customerName || request.customerName,
          customerEmail: data.customerEmail || request.customerEmail,
          customerPhone: data.customerPhone || request.customerPhone,
          status: feedbackStatus,
        }, tx);

        await ReputationRepository.updateRequestStatus(request.id, 'COMPLETED', tx);

        await tx.auditLog.create({
          data: {
            action: 'customer_feedback.received',
            entityType: 'CustomerFeedback',
            entityId: request.id,
            businessId: request.businessId,
            metadata: { rating: data.rating, isPositive },
          }
        });
      });

      return actionResult;
    } catch {
      return { error: 'Failed to submit feedback.', status: 500 };
    }
  }

  static async updateFeedbackStatus(id: string, businessId: string, status: string) {
    const updated = await ReputationRepository.updateFeedbackStatus(id, businessId, status);
    return updated.count > 0;
  }
}
