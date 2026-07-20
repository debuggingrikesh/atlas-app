import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { AcceptInvitationClient } from './AcceptInvitationClient';
import { InvitationProfileSetup } from './InvitationProfileSetup';

import Link from 'next/link';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
  const { token } = await params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: {
      business: true,
      role: true,
    },
  });

  // Render a full-page layout for the message
  const renderMessage = (title: string, description: string) => (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="mx-auto max-w-md w-full rounded-xl border bg-card p-6 shadow-sm text-center">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <Link 
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );

  // 1. Handle Edge Cases
  if (!invitation) {
    return renderMessage('Invalid Invitation', 'This invitation link is invalid or does not exist.');
  }

  if (invitation.status === 'EXPIRED' || invitation.expiresAt < new Date()) {
    return renderMessage('Invitation Expired', 'This invitation has expired. Please ask the administrator to send a new one.');
  }

  if (invitation.status === 'CANCELLED') {
    return renderMessage('Invitation Cancelled', 'This invitation has been cancelled by the administrator.');
  }

  if (invitation.status === 'ACCEPTED') {
    return renderMessage('Already Accepted', 'You have already accepted this invitation.');
  }

  // 2. Check Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Determine if an account exists for this email
    const existingUser = await prisma.userProfile.findUnique({
      where: { email: invitation.email },
    });

    const returnUrl = encodeURIComponent(`/invitations/${token}`);
    const emailParam = encodeURIComponent(invitation.email);
    
    if (existingUser) {
      redirect(`/auth/login?email=${emailParam}&returnTo=${returnUrl}`);
    } else {
      redirect(`/auth/signup?email=${emailParam}&returnTo=${returnUrl}`);
    }
  }

  // Enforce that the logged-in user's email matches the invitation email.
  if (user.email !== invitation.email) {
    return renderMessage(
      'Email Mismatch', 
      `This invitation was sent to ${invitation.email}, but you are logged in as ${user.email}. Please switch accounts to accept.`
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
  });

  if (!profile || !profile.fullName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <InvitationProfileSetup email={user.email!} />
      </div>
    );
  }

  // 3. Render Acceptance UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AcceptInvitationClient
        token={token}
        businessName={invitation.business.name}
        roleName={invitation.role.name}
        inviterEmail={invitation.email}
      />
    </div>
  );
}
