 

import type { AuditActionType, AuditResourceTypeType } from '@atlas/core/audit';
import { AuditService } from '@/lib/audit/audit-service';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import crypto from 'crypto';
import type { Invitation } from '../types';

import { sendEmail } from '@/lib/email/send-email';
import { generateInvitationEmailHtml } from '@/lib/email/templates/invitation';

export async function resendInvitation(
  actorId: string,
  businessId: string,
  invitationId: string
): Promise<
  | { invitation: Invitation; rawToken: string; errorRes: null }
  | { invitation: Invitation | null; rawToken: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const existingInvite = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!existingInvite || existingInvite.businessId !== businessId) {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('NOT_FOUND', 'Invitation not found.', 404),
    };
  }

  if (existingInvite.status !== 'PENDING' && existingInvite.status !== 'EXPIRED') {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('VALIDATION_ERROR', 'Only pending or expired invitations can be resent.', 400),
    };
  }

  // Generate new token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // New expiration (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.$transaction(async (tx) => {
    const updated = await tx.invitation.update({
      where: { id: invitationId },
      data: {
        tokenHash,
        expiresAt,
        status: 'PENDING', // Reactivate if it was expired
      },
      include: { role: true },
    });

    await AuditService.record({
        action: 'invitation.resent' as AuditActionType,
        resourceType: 'Invitation' as AuditResourceTypeType,
        resourceId: invitationId,
        actorType: 'USER',
        actorUserId: undefined,
        businessId: undefined,
        severity: 'INFO',
        summary: `System event ${'invitation.resent'}`,
        metadata: {
          email: updated.email,
        },
      
      }, tx)

    return updated;
  });

  // Send invitation email
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });
    
    const actor = await prisma.userProfile.findUnique({
      where: { id: actorId },
      select: { fullName: true },
    });

    if (business) {
      const emailHtml = generateInvitationEmailHtml({
        inviterName: actor?.fullName,
        businessName: business.name,
        roleName: invitation.role.name,
        rawToken,
      });

      const res = await sendEmail({
        to: invitation.email,
        subject: `Reminder: You've been invited to join ${business.name} on Atlas`,
        html: emailHtml,
      });

      if (!res.success) {
        return {
          invitation, // Preserve invitation
          rawToken: null,
          errorRes: errorResponse('EMAIL_FAILED', 'Invitation resent but email failed to send. Please try again.', 500)
        };
      }
    }
  } catch (err) {
    console.error('[Invitation] Unexpected error during email dispatch:', err);
    return {
      invitation,
      rawToken: null,
      errorRes: errorResponse('EMAIL_FAILED', 'Invitation resent but an unexpected error occurred while sending email.', 500)
    };
  }

  return { invitation, rawToken, errorRes: null };
}
