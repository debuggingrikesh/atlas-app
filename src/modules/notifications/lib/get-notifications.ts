/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import type { NotificationItem } from '../types';

export async function getNotifications(
  userId: string,
  businessId: string,
  options: { cursor?: string; limit: number }
): Promise<{ items: NotificationItem[]; nextCursor?: string }> {
  const { cursor, limit } = options;

  // Always enforce userId and businessId to guarantee isolation
  const notifications = await prisma.notification.findMany({
    where: { userId, businessId },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: { createdAt: 'desc' },
  });

  let nextCursor: string | undefined = undefined;
  if (notifications.length > limit) {
    const nextItem = notifications.pop();
    nextCursor = nextItem?.id;
  }

  // Map to the safe public type
  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    metadata: n.metadata,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));

  return { items, nextCursor };
}
