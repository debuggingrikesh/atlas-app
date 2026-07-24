 

import { prisma } from '../../../lib/db/prisma';
import { SubscriptionStatusSchema } from '@atlas/core';
import type { BusinessSubscriptionWithDetails, SubscriptionStatus } from '@atlas/core';

export class BillingRepository {
  static async getActiveSubscription(businessId: string): Promise<BusinessSubscriptionWithDetails | null> {
    const sub = await prisma.businessSubscription.findFirst({
      where: {
        businessId,
        status: SubscriptionStatusSchema.enum.ACTIVE,
      },
      include: {
        plan: {
          include: {
            features: true,
          }
        }
      }
    });

    if (!sub) return null;

    return {
      id: sub.id,
      businessId: sub.businessId,
      planId: sub.planId,
      status: sub.status as SubscriptionStatus,
      plan: {
        code: sub.plan.code,
        name: sub.plan.name,
        features: sub.plan.features.map(f => ({
          featureKey: f.featureKey,
          limit: f.limit,
          enabled: f.enabled,
        })),
      }
    };
  }

  static async getPlanByCode(code: string) {
    return prisma.plan.findUnique({
      where: { code }
    });
  }

  static async createSubscription(businessId: string, planId: string) {
    return prisma.businessSubscription.create({
      data: {
        businessId,
        planId,
        status: SubscriptionStatusSchema.enum.ACTIVE,
      }
    });
  }
}
