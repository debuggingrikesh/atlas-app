 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';

export class UpgradeRequestService {
  static async createRequest(
    businessId: string,
    requestedPlanCode: string,
    requestedBy: string,
    note?: string
  ) {
    // 1. Find the plan
    const plan = await prisma.plan.findUnique({
      where: { code: requestedPlanCode }
    });
    if (!plan) {
      return { error: 'Requested plan not found.', status: 404 };
    }

    // 2. Check for active pending request
    const existingPending = await prisma.upgradeRequest.findFirst({
      where: {
        businessId,
        status: 'PENDING'
      }
    });

    if (existingPending) {
      return { error: 'A pending upgrade request already exists for this business.', status: 400 };
    }

    // 3. Create request
    const request = await prisma.upgradeRequest.create({
      data: {
        businessId,
        requestedPlanId: plan.id,
        requestedBy,
        note,
        status: 'PENDING'
      },
      include: {
        requestedPlan: true,
        requester: true
      }
    });

    return { request };
  }

  static async approveRequest(requestId: string, adminActorId: string = 'system-admin') {
    return prisma.$transaction(async (tx) => {
      // 1. Find request
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { requestedPlan: true }
      });

      if (!request) {
        throw new Error('Upgrade request not found.');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Upgrade request is not pending.');
      }

      // 2. Update Subscription
      await tx.businessSubscription.update({
        where: { businessId: request.businessId },
        data: {
          planId: request.requestedPlanId,
          updatedAt: new Date()
        }
      });

      // 3. Update Request
      const updatedRequest = await tx.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          updatedAt: new Date()
        }
      });

      // 4. Create Audit Log
      await AuditService.record({
        action: 'subscription.upgrade_approved' as AuditActionType,
        resourceType: 'BusinessSubscription' as AuditResourceTypeType,
        resourceId: request.businessId,
        actorType: 'USER',
        actorUserId: adminActorId,
        businessId: request.businessId,
        severity: 'INFO',
        summary: `System event ${'subscription.upgrade_approved'}`,
        metadata: {
            requestId,
            planId: request.requestedPlanId,
            planCode: request.requestedPlan.code
          }
        
      }, tx)

      return updatedRequest;
    });
  }

  static async rejectRequest(requestId: string, adminActorId: string = 'system-admin') {
    return prisma.$transaction(async (tx) => {
      // 1. Find request
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Upgrade request not found.');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Upgrade request is not pending.');
      }

      // 2. Update Request
      const updatedRequest = await tx.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      });

      // 3. Create Audit Log
      await AuditService.record({
        action: 'subscription.upgrade_rejected' as AuditActionType,
        resourceType: 'BusinessSubscription' as AuditResourceTypeType,
        resourceId: request.businessId,
        actorType: 'USER',
        actorUserId: adminActorId,
        businessId: request.businessId,
        severity: 'INFO',
        summary: `System event ${'subscription.upgrade_rejected'}`,
        metadata: {
            requestId
          }
        
      }, tx)

      return updatedRequest;
    });
  }

  static async listRequests() {
    return prisma.upgradeRequest.findMany({
      include: {
        business: {
          include: {
            subscription: {
              include: { plan: true }
            }
          }
        },
        requestedPlan: true,
        requester: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
