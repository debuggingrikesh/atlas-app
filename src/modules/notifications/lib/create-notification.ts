import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';

export type CreateNotificationInput = {
  userId: string;
  businessId: string;
  type: string;
  title: string;
  message: string;
  metadata?: unknown;
};

/**
 * Creates a notification. Validates that the user belongs to the business.
 * Supports an optional Prisma transaction client.
 */
export async function createNotification(
  input: CreateNotificationInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;

  // 1. Validate user belongs to the business
  // Exception: INVITATION_RECEIVED is sent to non-members.
  if (input.type !== NOTIFICATION_EVENTS.INVITATION_RECEIVED) {
    const membership = await db.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: input.userId,
          businessId: input.businessId,
        },
      },
    });

    if (!membership) {
      console.warn(`[createNotification] User ${input.userId} does not belong to Business ${input.businessId}. Skipping notification.`);
      return;
    }
  }

  // 2. Prevent exact recent duplicates if possible (e.g. within last minute)
  // Optional depending on strictness, but let's do a simple check.
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const existing = await db.notification.findFirst({
    where: {
      userId: input.userId,
      businessId: input.businessId,
      type: input.type,
      title: input.title,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (existing) {
    console.warn(`[createNotification] Duplicate notification suppressed for user ${input.userId}.`);
    return;
  }

  // 3. Create the notification
  await db.notification.create({
    data: {
      userId: input.userId,
      businessId: input.businessId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}
