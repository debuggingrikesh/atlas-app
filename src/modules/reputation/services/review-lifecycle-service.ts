import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { AuditService } from '@/lib/audit/audit-service';
import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import type { Prisma } from '@prisma/client';

export type ReviewRequestState = 'PENDING' | 'OPENED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type CustomerFeedbackState = 'UNREAD' | 'REVIEWED' | 'RESOLVED' | 'NEW' | 'IN_REVIEW' | 'ACTION_REQUIRED' | 'ARCHIVED' | 'REDIRECTED';

interface TransitionConfig<T> {
  target: T;
  sideEffects?: (updates: any, actorId?: string) => void;
  description?: string;
}

interface LifecycleConfig<T extends string> {
  transitions: Record<T, TransitionConfig<T>[]>;
}

export const ReviewRequestLifecycle: LifecycleConfig<ReviewRequestState> = {
  transitions: {
    PENDING: [
      { target: 'OPENED', sideEffects: (u) => { u.openedAt = new Date(); } },
      { target: 'COMPLETED', sideEffects: (u) => { u.completedAt = new Date(); } },
      { target: 'EXPIRED' },
      { target: 'CANCELLED' }
    ],
    OPENED: [
      { target: 'COMPLETED', sideEffects: (u) => { u.completedAt = new Date(); } },
      { target: 'EXPIRED' },
      { target: 'CANCELLED' }
    ],
    COMPLETED: [],
    EXPIRED: [],
    CANCELLED: []
  }
};

export const CustomerFeedbackLifecycle: LifecycleConfig<CustomerFeedbackState> = {
  transitions: {
    UNREAD: [
      { target: 'REVIEWED' },
      { target: 'RESOLVED', sideEffects: (u, actorId) => { u.resolvedAt = new Date(); if (actorId) u.resolutionActor = { connect: { id: actorId } }; } },
      { target: 'NEW', description: 'Legacy Compatibility Transition' },
      { target: 'IN_REVIEW' }
    ],
    REVIEWED: [
      { target: 'RESOLVED', sideEffects: (u, actorId) => { u.resolvedAt = new Date(); if (actorId) u.resolutionActor = { connect: { id: actorId } }; } },
      { target: 'ARCHIVED' }
    ],
    RESOLVED: [
      { target: 'ARCHIVED' }
    ],
    NEW: [
      { target: 'IN_REVIEW' },
      { target: 'ACTION_REQUIRED' },
      { target: 'RESOLVED', sideEffects: (u, actorId) => { u.resolvedAt = new Date(); if (actorId) u.resolutionActor = { connect: { id: actorId } }; } },
      { target: 'ARCHIVED' }
    ],
    IN_REVIEW: [
      { target: 'ACTION_REQUIRED' },
      { target: 'RESOLVED', sideEffects: (u, actorId) => { u.resolvedAt = new Date(); if (actorId) u.resolutionActor = { connect: { id: actorId } }; } },
      { target: 'ARCHIVED' }
    ],
    ACTION_REQUIRED: [
      { target: 'RESOLVED', sideEffects: (u, actorId) => { u.resolvedAt = new Date(); if (actorId) u.resolutionActor = { connect: { id: actorId } }; } },
      { target: 'ARCHIVED' }
    ],
    ARCHIVED: [],
    REDIRECTED: []
  }
};

export class ReviewLifecycleService {
  static canTransition(entityType: 'ReviewRequest', currentState: string, targetState: string): boolean;
  static canTransition(entityType: 'CustomerFeedback', currentState: string, targetState: string): boolean;
  static canTransition(entityType: 'ReviewRequest' | 'CustomerFeedback', currentState: string, targetState: string): boolean {
    if (currentState === targetState) return true; // Idempotent

    if (entityType === 'ReviewRequest') {
      const allowed = ReviewRequestLifecycle.transitions[currentState as ReviewRequestState];
      return allowed?.some(t => t.target === targetState) ?? false;
    }
    if (entityType === 'CustomerFeedback') {
      const allowed = CustomerFeedbackLifecycle.transitions[currentState as CustomerFeedbackState];
      return allowed?.some(t => t.target === targetState) ?? false;
    }
    return false;
  }

  private static async recordTransition(
    entityType: 'ReviewRequest' | 'CustomerFeedback',
    id: string,
    businessId: string,
    previousState: string,
    newState: string,
    actorId?: string,
    tx: Prisma.TransactionClient = prisma
  ) {
    const action = entityType === 'ReviewRequest' ? 'reputation.review_request.updated' : 'customer_feedback.updated';
    await AuditService.record({
      action: action as AuditActionType,
      resourceType: entityType as AuditResourceTypeType,
      resourceId: id,
      actorType: actorId ? 'USER' : 'SYSTEM',
      actorUserId: actorId,
      businessId,
      tenantId: businessId,
      severity: 'INFO',
      summary: `${entityType} transitioned from ${previousState} to ${newState}`,
      metadata: { previousState, newState },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, tx as any);
  }

  static async transitionRequest(
    id: string,
    businessId: string,
    targetState: ReviewRequestState,
    actorId?: string,
    tx: Prisma.TransactionClient = prisma
  ) {
    const request = await tx.reviewRequest.findUnique({ where: { id, businessId } });
    if (!request) throw new AppError('Review request not found', 'NOT_FOUND', 404);

    if (request.status === targetState) return request;

    if (!this.canTransition('ReviewRequest', request.status, targetState)) {
      throw new AppError(`Invalid transition from ${request.status} to ${targetState}`, 'VALIDATION_ERROR', 400);
    }

    const config = ReviewRequestLifecycle.transitions[request.status as ReviewRequestState]?.find(t => t.target === targetState);
    const updates: Prisma.ReviewRequestUpdateInput = { status: targetState };
    
    if (config?.sideEffects) {
      config.sideEffects(updates, actorId);
    }

    const updated = await tx.reviewRequest.update({
      where: { id, businessId },
      data: updates
    });

    await this.recordTransition('ReviewRequest', id, businessId, request.status, targetState, actorId, tx);

    return updated;
  }

  static async transitionFeedback(
    id: string,
    businessId: string,
    targetState: CustomerFeedbackState,
    actorId?: string,
    tx: Prisma.TransactionClient = prisma
  ) {
    const feedback = await tx.customerFeedback.findUnique({ where: { id, businessId } });
    if (!feedback) throw new AppError('Feedback not found', 'NOT_FOUND', 404);

    if (feedback.status === targetState) return feedback;

    if (!this.canTransition('CustomerFeedback', feedback.status, targetState)) {
      throw new AppError(`Invalid transition from ${feedback.status} to ${targetState}`, 'VALIDATION_ERROR', 400);
    }

    const config = CustomerFeedbackLifecycle.transitions[feedback.status as CustomerFeedbackState]?.find(t => t.target === targetState);
    const updates: Prisma.CustomerFeedbackUpdateInput = { status: targetState };
    
    if (config?.sideEffects) {
      config.sideEffects(updates, actorId);
    }

    const updated = await tx.customerFeedback.update({
      where: { id, businessId },
      data: updates
    });

    await this.recordTransition('CustomerFeedback', id, businessId, feedback.status, targetState, actorId, tx);

    return updated;
  }

  // Semantic wrapper methods
  static markOpened(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionRequest(id, businessId, 'OPENED', actorId, tx);
  }

  static completeSurvey(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionRequest(id, businessId, 'COMPLETED', actorId, tx);
  }

  static expire(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionRequest(id, businessId, 'EXPIRED', actorId, tx);
  }

  static cancel(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionRequest(id, businessId, 'CANCELLED', actorId, tx);
  }

  static resolveFeedback(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionFeedback(id, businessId, 'RESOLVED', actorId, tx);
  }

  static archiveFeedback(id: string, businessId: string, actorId?: string, tx?: Prisma.TransactionClient) {
    return this.transitionFeedback(id, businessId, 'ARCHIVED', actorId, tx);
  }
}
