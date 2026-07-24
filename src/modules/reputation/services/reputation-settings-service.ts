/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
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
    data: Prisma.ReputationSettingsUpdateInput,
    requestId?: string
  ) {
    const settings = await ReputationRepository.updateSettings(businessId, data);
    
    // Create AuditLog
    await AuditService.record({
      action: 'reputation.settings.updated',
      resourceType: 'REPUTATION_SETTINGS',
      resourceId: settings.id,
      actorType: 'USER',
      actorUserId: userId,
      businessId: businessId,
      tenantId: businessId,
      requestId,
      severity: 'INFO',
      summary: 'User updated reputation settings',
      metadata: { changedFields: Object.keys(data) },
    });

    return settings;
  }
}
