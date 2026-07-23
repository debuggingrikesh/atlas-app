 

import { prisma } from '../db/prisma';
import { logger } from '../logger';
import type { Prisma } from '@prisma/client';
import type { BaseAuditEvent } from '@atlas/core/audit';

type TransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateAuditEventArgs extends Omit<BaseAuditEvent, 'requestId' | 'sourceService'> {
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

      if (!event.failSilently) {
        throw new Error(`Audit event persistence failed for action: ${event.action}`);
      }
    }
  }

  /**
   * Redacts common sensitive keys (passwords, tokens, cookies, secrets).
   */
  private static redactSensitiveData(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!obj) return undefined;

    const SENSITIVE_KEYS = ['password', 'token', 'secret', 'cookie', 'authorization', 'key'];
    
    // Create a shallow copy to modify safely
    const redacted = { ...obj };

    for (const [key, value] of Object.entries(redacted)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        redacted[key] = this.redactSensitiveData(value as Record<string, unknown>);
      }
    }

    return redacted;
  }
}
