export interface InvitationEmailProps {
  inviterName?: string | null;
  businessName: string;
  roleName: string;
  rawToken: string;
}

export function generateInvitationEmailHtml({
  inviterName,
  businessName,
  roleName,
  rawToken,
}: InvitationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationLink = `${appUrl}/invitations/${rawToken}`;
  const inviterText = inviterName ? `**${inviterName}**` : 'Someone';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0f172a; margin: 0;">Project Atlas</h1>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; text-align: center;">
        <h2 style="margin-top: 0; color: #1e293b;">You've been invited!</h2>
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          ${inviterText} has invited you to join <strong>${businessName}</strong> on Project Atlas as a <strong>${roleName}</strong>.
        </p>
        
        <a href="${invitationLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
          This invitation link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Project Atlas. All rights reserved.
      </div>
    </div>
  `;
}
