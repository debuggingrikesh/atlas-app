/* eslint-disable @typescript-eslint/no-explicit-any */

import { BillingRepository } from '../repositories/billing-repository';
import { SubscriptionService } from './subscription-service';

export class EntitlementService {
  /**
   * Always resolves by businessId. Backend remains source of truth.
   * Gets the active subscription, or falls back to creating a FREE one.
   */
  static async getSubscription(businessId: string) {
    let sub = await BillingRepository.getActiveSubscription(businessId);
    if (!sub) {
      // Graceful fallback for migration
      sub = await SubscriptionService.assignFreePlan(businessId);
    }
    return sub;
  }

  static async getFeatureLimit(businessId: string, featureKey: string): Promise<number> {
    const sub = await this.getSubscription(businessId);
    if (!sub) return 0; // Failsafe

    const feature = sub.plan.features.find(f => f.featureKey === featureKey);
    if (!feature) {
      // Default limits for safety if feature not found
      if (featureKey === 'REPUTATION_REVIEW_REQUESTS') return 6;
      return 0;
    }

    return feature.limit;
  }

  static async canAccessFeature(businessId: string, featureKey: string): Promise<boolean> {
    const sub = await this.getSubscription(businessId);
    if (!sub) return false;

    const feature = sub.plan.features.find(f => f.featureKey === featureKey);
    if (!feature) {
      return false; // Default off
    }

    return feature.enabled;
  }
}
