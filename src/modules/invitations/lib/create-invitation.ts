import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api/response';
import crypto from 'crypto';
import { createNotification } from '@/modules/notifications/lib/create-notification';
import { NOTIFICATION_EVENTS } from '@/lib/constants/notification-events';
import type { CreateInvitationInput, Invitation } from '../types';
import { sendEmail } from '@/lib/email/send-email';
import { generateInvitationEmailHtml } from '@/lib/email/templates/invitation';

/**
 * Creates a new invitation for a business.
 * Rejects if user is already a member, if there's an active PENDING invite, or if assigning OWNER.
 */
export async function createInvitation(
  actorId: string,
  businessId: string,
  input: CreateInvitationInput
): Promise<
  | { invitation: Invitation; rawToken: string; errorRes: null }
  | { invitation: Invitation | null; rawToken: null; errorRes: ReturnType<typeof errorResponse> }
> {
  const { email, roleId, metadata } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verify role exists and is not OWNER
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role || role.businessId !== businessId) {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('VALIDATION_ERROR', 'Role not found.', 400),
    };
  }

  if (role.name === 'OWNER') {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('VALIDATION_ERROR', 'Cannot invite users as OWNER.', 400),
    };
  }

  // 2. Check if user is already a member
  // We need to check by email. Since BusinessMember points to UserProfile (which has email),
  // we do a relational check.
  const existingMember = await prisma.businessMember.findFirst({
    where: {
      businessId,
      user: {
        email: normalizedEmail,
      },
    },
  });

  if (existingMember) {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('VALIDATION_ERROR', 'User is already a member of this business.', 400),
    };
  }

  // 3. Check for existing PENDING unexpired invitation
  const now = new Date();
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      businessId,
      email: normalizedEmail,
      status: 'PENDING',
      expiresAt: {
        gt: now,
      },
    },
  });

  if (existingInvite) {
    return {
      invitation: null,
      rawToken: null,
      errorRes: errorResponse('VALIDATION_ERROR', 'An active invitation already exists for this email.', 400),
    };
  }

  // 4. Generate token and hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // 7 days expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 5. Create in transaction with audit log
  const invitation = await prisma.$transaction(async (tx) => {
    const invite = await tx.invitation.create({
      data: {
        businessId,
        email: normalizedEmail,
        roleId,
        tokenHash,
        metadata: metadata ? (metadata as object) : undefined,
        expiresAt,
      },
      include: { role: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'invitation.created',
        entityType: 'Invitation',
        entityId: invite.id,
        actorId,
        businessId,
        metadata: {
          email: normalizedEmail,
          roleId,
        },
      },
    });

    // 6. Check if invited user exists
    const invitedUser = await tx.userProfile.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (invitedUser) {
      await createNotification(
        {
          userId: invitedUser.id,
          businessId,
          type: NOTIFICATION_EVENTS.INVITATION_RECEIVED,
          title: 'New Invitation',
          message: 'You have been invited to join a business.',
          metadata: { invitationId: invite.id, roleName: role.name },
        },
        tx
      );
    }

    return invite;
  });

  // 7. Send invitation email
  try {
    // Fetch business and actor info for the email template
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
        roleName: role.name,
        rawToken,
      });

      const res = await sendEmail({
        to: normalizedEmail,
        subject: `You've been invited to join ${business.name} on Atlas`,
        html: emailHtml,
      });

      if (!res.success) {
        return {
          invitation, // Preserve invitation
          rawToken: null,
          errorRes: errorResponse('EMAIL_FAILED', 'Invitation created but email failed to send. Please try resending.', 500)
        };
      }
    }
  } catch (err) {
    console.error('[Invitation] Unexpected error during email dispatch:', err);
    return {
      invitation,
      rawToken: null,
      errorRes: errorResponse('EMAIL_FAILED', 'Invitation created but an unexpected error occurred while sending email.', 500)
    };
  }

  return { invitation, rawToken, errorRes: null };
}
