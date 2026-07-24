/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
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

    await AuditService.record({
        action: 'review_campaign.created' as AuditActionType,
        resourceType: 'ReviewCampaign' as AuditResourceTypeType,
        resourceId: campaign.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'review_campaign.created'}`,
        metadata: data as any as Record<string, unknown>,
      
      }, undefined)

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
      await AuditService.record({
        action: 'review_campaign.updated' as AuditActionType,
        resourceType: 'ReviewCampaign' as AuditResourceTypeType,
        resourceId: id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'review_campaign.updated'}`,
        metadata: data as any as Record<string, unknown>,
        
      }, undefined)
    }

    return campaigns.count > 0;
  }

  static async archiveCampaign(
    userId: string,
    id: string,
    businessId: string
  ) {
    const campaigns = await ReputationRepository.updateCampaign(id, businessId, { 
      archivedAt: new Date(),
      archivedBy: userId,
    });
    
    if (campaigns.count > 0) {
      await AuditService.record({
        action: 'review_campaign.archived' as AuditActionType,
        resourceType: 'ReviewCampaign' as AuditResourceTypeType,
        resourceId: id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: businessId,
        severity: 'INFO',
        summary: `System event ${'review_campaign.archived'}`,
        metadata: {},
      }, undefined);
    }

    return campaigns.count > 0;
  }

  static async duplicateCampaign(
    userId: string,
    id: string,
    businessId: string
  ) {
    const existing = await ReputationRepository.getCampaignById(id, businessId);
    
    if (!existing) {
      throw new Error('Campaign not found');
    }

    const allCampaigns = await ReputationRepository.getCampaigns(businessId);
    const existingNames = allCampaigns.map(c => c.name);

    const { CampaignDuplicateFactory } = await import('../lib/campaign-duplicate-factory');
    const input = CampaignDuplicateFactory.createDuplicateInput(existing, existingNames);

    return this.createCampaign(userId, businessId, {
      name: input.name,
      branchId: input.branchId || undefined,
      googleReviewUrl: input.googleReviewUrl || undefined,
    });
  }
}
