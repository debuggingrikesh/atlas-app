import { Prisma } from '@prisma/client';
import { ReputationRepository } from '../repositories/reputation-repository';
import { prisma } from '@/lib/db/prisma';

export class CampaignService {
  static async createCampaign(
    userId: string,
    businessId: string,
    data: { name: string; branchId?: string; googleReviewUrl?: string }
  ) {
    const publicId = crypto.randomUUID();
    
    const campaign = await ReputationRepository.createCampaign({
      businessId,
      branchId: data.branchId,
      name: data.name,
      googleReviewUrl: data.googleReviewUrl || null,
      publicId,
    });

    await prisma.auditLog.create({
      data: {
        action: 'review_campaign.created',
        entityType: 'ReviewCampaign',
        entityId: campaign.id,
        actorId: userId,
        businessId,
        metadata: data as Prisma.InputJsonValue,
      }
    });

    return campaign;
  }

  static async getCampaigns(businessId: string) {
    return ReputationRepository.getCampaigns(businessId);
  }

  static async getCampaignById(id: string, businessId: string) {
    return ReputationRepository.getCampaignById(id, businessId);
  }

  static async updateCampaign(
    userId: string,
    id: string,
    businessId: string,
    data: Prisma.ReviewCampaignUpdateInput
  ) {
    const campaigns = await ReputationRepository.updateCampaign(id, businessId, data);
    
    if (campaigns.count > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'review_campaign.updated',
          entityType: 'ReviewCampaign',
          entityId: id,
          actorId: userId,
          businessId,
          metadata: data as Prisma.InputJsonValue,
        }
      });
    }

    return campaigns.count > 0;
  }
}
