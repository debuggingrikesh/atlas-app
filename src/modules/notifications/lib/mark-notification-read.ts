/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  // First, verify ownership to ensure no cross-user access
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized: You can only mark your own notifications as read');
  }

  // Update
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}
