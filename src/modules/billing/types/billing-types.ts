export type PlanCode = 'FREE' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface PlanFeatureDefinition {
  featureKey: string;
  limit: number;
  enabled: boolean;
}

export interface BusinessSubscriptionWithDetails {
  id: string;
  businessId: string;
  planId: string;
  status: SubscriptionStatus;
  plan: {
    code: string;
    name: string;
    features: PlanFeatureDefinition[];
  };
}
