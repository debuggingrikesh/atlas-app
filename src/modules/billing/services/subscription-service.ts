 

import { BillingRepository } from '../repositories/billing-repository';
import type { BusinessSubscriptionWithDetails } from '@atlas/core/contracts/billing';
import { logger } from '../../../lib/logger';

import { prisma } from '../../../lib/db/prisma';

export class SubscriptionService {
  /**
   * Assigns a FREE plan to the business. Used as a fallback and during business creation.
   */
  static async assignFreePlan(businessId: string): Promise<BusinessSubscriptionWithDetails | null> {
    const freePlan = await BillingRepository.getPlanByCode('FREE');
    if (!freePlan) {
      logger.error({ message: 'FREE plan not found in database', feature: 'billing' });
      return null;
    }

    await prisma.businessSubscription.upsert({
      where: { businessId },
      update: {
        planId: freePlan.id,
        status: 'ACTIVE',
      },
      create: {
        businessId,
        planId: freePlan.id,
        status: 'ACTIVE',
      },
    });
    
    // Re-fetch to get the fully hydrated model
    return BillingRepository.getActiveSubscription(businessId);
  }
}
