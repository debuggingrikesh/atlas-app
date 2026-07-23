import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { ReputationRepository } from '../repositories/reputation-repository';
import { ReputationSettingsService } from './reputation-settings-service';
import crypto from 'crypto';

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

  static async getCampaignDetailsByPublicId(publicId: string) {
    const campaign = await ReputationRepository.getCampaignByPublicId(publicId);
    
    if (!campaign) {
      return { error: 'Invalid campaign link.', status: 404 };
    }
    
    if (campaign.status !== 'ACTIVE') {
      return { error: 'This campaign is currently inactive.', status: 400 };
    }

    return { campaign };
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

        await AuditService.record({
        action: 'customer_feedback.received' as AuditActionType,
        resourceType: 'CustomerFeedback' as AuditResourceTypeType,
        resourceId: request.id,
        actorType: 'USER',
        actorUserId: undefined,
        businessId: request.businessId,
        severity: 'INFO',
        summary: `System event ${'customer_feedback.received'}`,
        metadata: { rating: data.rating, isPositive },
          
      }, tx)
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

  static async submitCampaignReview(publicId: string, data: {
    rating: number;
    comment?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) {
    // 1. Find campaign
    const campaign = await ReputationRepository.getCampaignByPublicId(publicId);
    
    if (!campaign) {
      return { error: 'Invalid campaign link.', status: 404 };
    }

    if (campaign.status !== 'ACTIVE') {
      return { error: 'This campaign is currently inactive.', status: 400 };
    }

    // 2. Load settings
    const settings = await ReputationSettingsService.getSettings(campaign.businessId);

    // 3. Determine feedback status and action based on threshold
    const isPositive = data.rating >= settings.googleRedirectRating;
    const feedbackStatus = isPositive ? 'REDIRECTED' : 'UNREAD';
    const actionResult = isPositive
      ? { action: 'GOOGLE_REDIRECT', redirectUrl: campaign.googleReviewUrl }
      : { action: 'INTERNAL_FEEDBACK_SAVED' };

    // 4. Create request and feedback in a single transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Generate a unique token for the auto-created request
        const token = crypto.randomBytes(16).toString('hex');
        
        const request = await ReputationRepository.createReviewRequest({
          businessId: campaign.businessId,
          branchId: campaign.branchId,
          campaignId: campaign.id,
          token,
          status: 'COMPLETED', // created already completed
          source: 'PUBLIC_LINK',
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          completedAt: new Date(),
        }, tx);

        await ReputationRepository.createFeedback({
          businessId: campaign.businessId,
          branchId: campaign.branchId,
          requestId: request.id,
          rating: data.rating,
          comment: data.comment,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          status: feedbackStatus,
        }, tx);

        await AuditService.record({
        action: 'customer_feedback.received' as AuditActionType,
        resourceType: 'CustomerFeedback' as AuditResourceTypeType,
        resourceId: request.id,
        actorType: 'USER',
        actorUserId: undefined,
        businessId: campaign.businessId,
        severity: 'INFO',
        summary: `System event ${'customer_feedback.received'}`,
        metadata: { rating: data.rating, isPositive, source: 'PUBLIC_LINK' },
          
      }, tx)
      });

      return actionResult;
    } catch (err) {
      console.error('[FeedbackService.submitCampaignReview] Error:', err);
      return { error: 'Failed to submit feedback.', status: 500 };
    }
  }
}
