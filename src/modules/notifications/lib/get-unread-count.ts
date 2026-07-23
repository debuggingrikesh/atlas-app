 

import { prisma } from '@/lib/db/prisma';

export async function getUnreadCount(userId: string, businessId?: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      ...(businessId && { businessId }),
      readAt: null,
    },
  });
}
