import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { Prisma } from '@prisma/client';
import { ReputationRepository } from '../repositories/reputation-repository';
import { prisma } from '@/lib/db/prisma';

export class ReputationSettingsService {
  static async getSettings(businessId: string) {
    let settings = await ReputationRepository.getSettings(businessId);
    
    if (!settings) {
      settings = await ReputationRepository.updateSettings(businessId, {
        googleRedirectRating: 4,
      });
    }

    return settings;
  }

  static async updateSettings(
    userId: string,
    businessId: string, 
    data: Prisma.ReputationSettingsUpdateInput
  ) {
    const settings = await ReputationRepository.updateSettings(businessId, data);
    
    // Create AuditLog
    await AuditService.record({
        action: 'reputation.settings.updated' as AuditActionType,
        resourceType: 'ReputationSettings' as AuditResourceTypeType,
        resourceId: settings.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'reputation.settings.updated'}`,
        metadata: data as unknown as Record<string, unknown>,
      
      }, undefined)

    return settings;
  }
}
