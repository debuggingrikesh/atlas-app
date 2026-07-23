 

import { prisma } from '@/lib/db/prisma';

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  // First, verify ownership to ensure no cross-user access
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  // Update
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}
