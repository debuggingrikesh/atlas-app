/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';
import { logger } from '@/lib/logger';

export type CreateNotificationInput = {
  userId: string;
  businessId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
};

/**
 * Creates a notification. Validates that the user belongs to the business.
 * Supports an optional Prisma transaction client.
 */
export async function createNotification(
  input: CreateNotificationInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  try {
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
        logger.warn({ message: 'User does not belong to business, skipping notification', userId: input.userId, businessId: input.businessId, feature: 'notifications' });
        return;
      }
    }

    // 2. Prevent exact recent duplicates if possible (e.g. within last minute)
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
      logger.warn({ message: 'Duplicate notification suppressed', userId: input.userId, feature: 'notifications' });
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
  } catch (error) {
    logger.error({ message: 'Failed to create notification', feature: 'notifications' }, error instanceof Error ? error.message : String(error));
    // If we are in a transaction, we must rethrow to ensure rollback occurs
    if (tx) {
      throw error;
    }
  }
}
