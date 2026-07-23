 

import { BillingRepository } from '../repositories/billing-repository';
import type { BusinessSubscriptionWithDetails } from '@atlas/core/contracts/billing';
import { logger } from '@/lib/logger';

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

    // Upsert subscription logic is simplified here as create.
    // Assuming this is only called when active sub does not exist.
    await BillingRepository.createSubscription(businessId, freePlan.id);
    
    // Re-fetch to get the fully hydrated model
    return BillingRepository.getActiveSubscription(businessId);
  }
}
