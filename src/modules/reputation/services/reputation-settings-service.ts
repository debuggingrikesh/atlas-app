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
    await prisma.auditLog.create({
      data: {
        action: 'reputation.settings.updated',
        entityType: 'ReputationSettings',
        entityId: settings.id,
        actorId: userId,
        businessId,
        metadata: data as Prisma.InputJsonValue,
      }
    });

    return settings;
  }
}
