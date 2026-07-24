 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { ReputationRepository } from '../repositories/reputation-repository';
import { UsageService } from '@/modules/reputation/services/usage-service';
import { EntitlementService } from '@/modules/billing/services/entitlement-service';
import { randomBytes } from 'crypto';

export class ReviewRequestService {
  static async createRequest(
    userId: string,
    businessId: string,
    data: {
      campaignId: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      source?: 'MANUAL' | 'WHATSAPP' | 'QR' | 'EMAIL';
    },
    requestId?: string
  ) {
    // 1. Validate campaign belongs to business
    const campaign = await ReputationRepository.getCampaignById(data.campaignId, businessId);
    if (!campaign) {
      return { error: 'Campaign not found or does not belong to this business.', status: 404 };
    }

    // 2. Start transaction
    try {
      const request = await prisma.$transaction(async (tx) => {
        // 3. Check and increment usage
        const featureLimit = await EntitlementService.getFeatureLimit(businessId, 'REPUTATION_REVIEW_REQUESTS');
        
        // Skip increment check if limit is -1 (unlimited)
        let usageCheck: { allowed: boolean; error?: string } = { allowed: true };
        if (featureLimit !== -1) {
          usageCheck = await UsageService.checkAndIncrementUsage(
            businessId,
            'REPUTATION_REVIEW_REQUESTS',
            featureLimit,
            tx
          );
        }

        if (!usageCheck.allowed) {
          throw new Error(usageCheck.error);
        }

        // 4. Generate secure token
        const token = randomBytes(32).toString('hex');

        // 5. Create ReviewRequest
        const reviewReq = await ReputationRepository.createReviewRequest({
          businessId,
          branchId: campaign.branchId,
          campaignId: campaign.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          token,
          status: 'PENDING',
          source: data.source,
        }, tx);

        // 6. Create AuditLog
        await AuditService.record({
          action: 'reputation.review_request.created',
          resourceType: 'REVIEW_REQUEST',
          resourceId: reviewReq.id,
          actorType: 'USER',
          actorUserId: userId,
          businessId: businessId,
          tenantId: businessId,
          requestId,
          severity: 'INFO',
          summary: 'User created a review request',
          metadata: { campaignId: campaign.id, branchId: campaign.branchId },
        }, tx);

        return reviewReq;
      });

      return { request };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create review request.', status: 400 };
    }
  }
}
