 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import crypto from 'crypto';
import type { MemberRole } from '@prisma/client';
import { createNotification } from '@/modules/notifications/lib/create-notification';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';

export async function acceptInvitation(
  userId: string,
  userEmail: string,
  rawToken: string,
  requestId?: string
): Promise<{ errorRes: ReturnType<typeof errorResponse> | null }> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { role: true },
  });

  if (!invitation) {
    return { errorRes: errorResponse('NOT_FOUND', 'Invalid invitation token.', 404) };
  }

  // Security check: email must match
  if (invitation.email !== userEmail.toLowerCase().trim()) {
    return {
      errorRes: errorResponse(
        'FORBIDDEN',
        'This invitation was sent to a different email address.',
        403
      ),
    };
  }

  // Lazy expiration check
  if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
    return {
      errorRes: errorResponse('VALIDATION_ERROR', 'This invitation is expired or no longer valid.', 400),
    };
  }

  // Check if already a member
  const existingMember = await prisma.businessMember.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: invitation.businessId,
      },
    },
  });

  if (existingMember) {
    return {
      errorRes: errorResponse('VALIDATION_ERROR', 'You are already a member of this business.', 400),
    };
  }

  // Map to legacy enum if it matches
  let legacyRole: MemberRole = 'MEMBER';
  if (['OWNER', 'ADMIN', 'MEMBER'].includes(invitation.role.name)) {
    legacyRole = invitation.role.name as MemberRole;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Upsert UserProfile to ensure it exists (important for new users coming from signup)
    await tx.userProfile.upsert({
      where: { id: userId },
      update: {}, // Do nothing if it exists
      create: {
        id: userId,
        email: userEmail.toLowerCase().trim(),
        onboardingStep: 4, // Skip onboarding for invited users
        isActive: true,
      },
    });

    // 2. Create membership
    await tx.businessMember.create({
      data: {
        userId,
        businessId: invitation.businessId,
        roleId: invitation.roleId,
        role: legacyRole, // dual-write for legacy compat
      },
    });

    // 2. Mark accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    // 3. Audit log
    await AuditService.record({
      action: 'team.invitation.accepted',
      resourceType: 'INVITATION',
      resourceId: invitation.id,
      actorType: 'USER',
      actorUserId: userId,
      businessId: invitation.businessId,
      tenantId: invitation.businessId,
      requestId,
      severity: 'INFO',
      summary: `User accepted invitation for role: ${invitation.roleId}`,
      metadata: { roleId: invitation.roleId },
    }, tx);

    // 4. Notify business Owners and Admins
    const admins = await tx.businessMember.findMany({
      where: {
        businessId: invitation.businessId,
        rbacRole: {
          name: { in: ['OWNER', 'ADMIN'] },
        },
      },
      select: { userId: true },
    });

    for (const admin of admins) {
      if (admin.userId === userId) continue; // Don't notify the person who just joined

      await createNotification(
        {
          userId: admin.userId,
          businessId: invitation.businessId,
          type: NOTIFICATION_EVENTS.INVITATION_ACCEPTED,
          title: 'Invitation Accepted',
          message: 'A new user has accepted their invitation and joined the business.',
          metadata: { newMemberId: userId },
        },
        tx
      );
    }
  });

  return { errorRes: null };
}
