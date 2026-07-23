 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import type { UpdateBusinessInput } from '@/lib/validators/business';
import type { Business } from '@/modules/business/types';
import { createNotification } from '@/modules/notifications/lib/create-notification';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';

/**
 * Updates an existing Business record and emits an AuditLog entry,
 * all inside a single Prisma transaction.
 *
 * Only call this from server-side code after:
 *   1. requireAuth() — to confirm identity
 *   2. requirePermission(userId, businessId, 'business.update') — to confirm permission
 *
 * The function never re-generates the slug. Name changes are stored but the
 * public URL identifier (slug) is intentionally stable.
 */
export async function updateBusiness(
  userId: string,
  businessId: string,
  input: UpdateBusinessInput
): Promise<Business> {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch current state for audit logging before modifying
    const currentBusiness = await tx.business.findUnique({ where: { id: businessId } });
    if (!currentBusiness) {
      throw new Error('Business not found.');
    }

    const updateCount = await tx.business.updateMany({
      where: { 
        id: businessId,
        ...(input.version !== undefined && { version: input.version })
      },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        version: { increment: 1 },
      },
    });

    if (updateCount.count === 0) {
      throw new Error('409: Conflict. The business was updated by someone else.');
    }

    const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });

    // 2. Audit log with detailed changes
    await AuditService.record({
        action: 'business.updated' as AuditActionType,
        resourceType: 'Business' as AuditResourceTypeType,
        resourceId: business.id,
        actorType: 'USER',
        actorUserId: userId,
        businessId: business.id,
        severity: 'INFO',
        summary: `System event ${'business.updated'}`,
        metadata: { 
          changes: input,
          previous: {
            name: currentBusiness.name,
            description: currentBusiness.description,
            logoUrl: currentBusiness.logoUrl,
          }
        },
      
      }, tx)

    // 3. Notify business Owners and Admins
    const admins = await tx.businessMember.findMany({
      where: {
        businessId: business.id,
        rbacRole: {
          name: { in: ['OWNER', 'ADMIN'] },
        },
      },
      select: { userId: true },
    });

    for (const admin of admins) {
      if (admin.userId === userId) continue; // Don't notify the person who made the change

      await createNotification(
        {
          userId: admin.userId,
          businessId: business.id,
          type: NOTIFICATION_EVENTS.BUSINESS_UPDATED,
          title: 'Business Updated',
          message: 'The business settings have been updated.',
          metadata: { changes: input },
        },
        tx
      );
    }

    return business;
  });
}
