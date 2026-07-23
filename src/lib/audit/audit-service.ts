 

import { prisma } from '../db/prisma';
import { logger } from '../logger';
import type { Prisma } from '@prisma/client';
import type { BaseAuditEvent, AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';

type TransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export type AppAuditAction =
  | AuditActionType
  | 'team.invitation.created'
  | 'team.invitation.resent'
  | 'team.invitation.accepted'
  | 'reputation.settings.updated'
  | 'reputation.review_request.created'
  | 'reputation.feedback.analyzed'
  | 'business.settings.updated';

export type AppAuditResourceType =
  | AuditResourceTypeType
  | 'INVITATION'
  | 'REPUTATION_SETTINGS'
  | 'REVIEW_REQUEST'
  | 'FEEDBACK_ANALYSIS'
  | 'BUSINESS';

export interface CreateAuditEventArgs extends Omit<BaseAuditEvent, 'action' | 'resourceType' | 'requestId' | 'sourceService'> {
  action: AppAuditAction;
  resourceType: AppAuditResourceType;
  requestId?: string;
  sourceService?: 'atlas-app' | 'atlas-hq';
  failSilently?: boolean;
}

export class AuditService {
  /**
   * Records a business or security audit event durably.
   * By default, it will throw if it fails (to ensure critical audit trails are captured),
   * unless `failSilently: true` is passed for lower-risk events.
   *
   * Accepts an optional `tx` (Prisma transaction client) so that the audit write can be
   * atomically tied to the business mutation.
   */
  static async record(
    event: CreateAuditEventArgs,
    tx?: TransactionClient
  ): Promise<void> {
    const db = tx ?? prisma;
    const finalRequestId = event.requestId; // Expected to be provided by the caller or global context if available

    try {
      // Redact sensitive data recursively before persisting
      const safeMetadata = this.redactSensitiveData(event.metadata);
      const safePrevState = this.redactSensitiveData(event.previousState);
      const safeNewState = this.redactSensitiveData(event.newState);

      await db.auditEvent.create({
        data: {
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          actorType: event.actorType,
          actorUserId: event.actorUserId,
          actorRole: event.actorRole,
          businessId: event.businessId,
          tenantId: event.tenantId,
          requestId: finalRequestId,
          sourceService: event.sourceService ?? 'atlas-app',
          severity: event.severity,
          summary: event.summary,
          metadata: safeMetadata ? (safeMetadata as Prisma.InputJsonValue) : undefined,
          previousState: safePrevState ? (safePrevState as Prisma.InputJsonValue) : undefined,
          newState: safeNewState ? (safeNewState as Prisma.InputJsonValue) : undefined,
          ipAddressHash: event.ipAddressHash,
          userAgentSummary: event.userAgentSummary,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit event', {
        action: event.action,
        error: error instanceof Error ? error.message : String(error),
      });

      // If explicitly part of a transaction, throw so Prisma aborts the transaction.
      // Otherwise, log and swallow (failSilently defaults to true for standalone ops).
      const shouldThrow = event.failSilently === false || (tx && event.failSilently !== true);
      if (shouldThrow) {
        throw new Error(`Audit event persistence failed for action: ${event.action}`);
      }
    }
  }

  /**
   * Redacts sensitive keys safely with exact matching.
   */
  private static redactSensitiveData(
    obj: unknown,
    seen = new WeakSet(),
    depth = 0
  ): unknown {
    if (obj === null || obj === undefined) return obj;
    if (depth > 5) return '[MAX_DEPTH]';
    if (typeof obj !== 'object') return obj;

    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Error) return { message: obj.message, name: obj.name };

    // Prevent circular references
    if (seen.has(obj)) return '[CIRCULAR]';
    seen.add(obj);

    const SENSITIVE_KEYS = [
      'email', 'phone', 'token', 'authorization',
      'cookie', 'password', 'secret', 'prompt', 'output',
      'reviewtext', 'feedbacktext', 'customername', 'ip_address'
    ];

    const SAFE_IDENTIFIERS = new Set([
      'reviewid', 'feedbackid', 'campaignid', 'resourceid',
      'businessid', 'tenantid', 'userid', 'actoruserid'
    ]);

    if (Array.isArray(obj)) {
      const MAX_ARRAY_LENGTH = 100;
      if (obj.length > MAX_ARRAY_LENGTH) {
        const truncated = obj.slice(0, MAX_ARRAY_LENGTH).map(item => this.redactSensitiveData(item, seen, depth + 1));
        truncated.push('[MAX_ARRAY_LENGTH]');
        return truncated;
      }
      return obj.map(item => this.redactSensitiveData(item, seen, depth + 1));
    }

    const redacted: Record<string, unknown> = {};
    const MAX_OBJECT_KEYS = 100;
    let keyCount = 0;

    for (const [key, value] of Object.entries(obj)) {
      if (keyCount >= MAX_OBJECT_KEYS) {
        redacted['[MAX_OBJECT_KEYS]'] = 'Truncated';
        break;
      }
      keyCount++;
      const lowerKey = key.toLowerCase();
      if (SAFE_IDENTIFIERS.has(lowerKey)) {
        redacted[key] = this.redactSensitiveData(value, seen, depth + 1);
      } else if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = this.redactSensitiveData(value, seen, depth + 1);
      }
    }

    return redacted;
  }
}
