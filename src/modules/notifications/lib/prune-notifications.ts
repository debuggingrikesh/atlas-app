/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';

/**
 * Prunes read notifications that were marked as read more than 30 days ago.
 * Returns the count of deleted notifications.
 */
export async function pruneNotifications(): Promise<{ count: number }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.deleteMany({
    where: {
      readAt: {
        lt: thirtyDaysAgo,
      },
    },
  });

  return { count: result.count };
}
