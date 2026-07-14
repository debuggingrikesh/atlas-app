import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export class UsageRepository {
  static async getUsage(businessId: string, feature: string, tx: Prisma.TransactionClient = prisma) {
    return tx.businessFeatureUsage.findUnique({
      where: {
        businessId_feature: {
          businessId,
          feature,
        },
      },
    });
  }

  static async initializeUsage(businessId: string, feature: string, limit: number, tx: Prisma.TransactionClient = prisma) {
    return tx.businessFeatureUsage.create({
      data: {
        businessId,
        feature,
        limit,
        count: 0,
      },
    });
  }

  static async incrementUsage(businessId: string, feature: string, tx: Prisma.TransactionClient = prisma) {
    return tx.businessFeatureUsage.update({
      where: {
        businessId_feature: {
          businessId,
          feature,
        },
      },
      data: {
        count: { increment: 1 },
      },
    });
  }
}
