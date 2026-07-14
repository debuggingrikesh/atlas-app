import { Prisma } from '@prisma/client';

export class UsageService {
  /**
   * Checks if a business has usage available for a feature.
   * If usage record doesn't exist, lazily creates it.
   */
  static async checkAndIncrementUsage(
    businessId: string,
    feature: string,
    limit: number,
    tx: Prisma.TransactionClient
  ) {
    let usage = await tx.businessFeatureUsage.findUnique({
      where: {
        businessId_feature: { businessId, feature },
      },
    });

    if (!usage) {
      try {
        usage = await tx.businessFeatureUsage.create({
          data: {
            businessId,
            feature,
            limit,
            count: 1, // Atomic initialize with 1
          },
        });
        return { allowed: true };
      } catch {
        // Fall back to update if created concurrently
      }
    } else if (usage.limit !== limit && limit !== -1) {
      // Sync the limit if it has changed from the entitlement plan
      await tx.businessFeatureUsage.update({
        where: { id: usage.id },
        data: { limit }
      });
    }

    // Atomic increment using updateMany to ensure we only increment if below limit
    const result = await tx.businessFeatureUsage.updateMany({
      where: {
        businessId,
        feature,
        ...(limit !== -1 ? { count: { lt: limit } } : {}),
      },
      data: {
        count: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return {
        allowed: false,
        code: 'PAYMENT_REQUIRED',
        error: `You have reached the limit for ${feature}. Please upgrade your plan to continue.`,
      };
    }

    return { allowed: true };
  }
}
