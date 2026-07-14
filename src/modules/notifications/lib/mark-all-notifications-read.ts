import { prisma } from '@/lib/db/prisma';

export async function markAllNotificationsRead(
  userId: string,
  businessId: string
): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      businessId,
      readAt: null, // Only update unread notifications
    },
    data: {
      readAt: new Date(),
    },
  });

  return { count: result.count };
}
