# Email Delivery Audit - Project Atlas

## Current Email Capability Status
**Status:** 🔴 **Missing / Not Implemented**
Currently, the application generates a secure invitation token (hashed in the database and sent as raw in the API response) but it **does not send an email** to the invited user. The recipient has no way of receiving the invitation link unless the inviter manually copies the API response (which is not exposed to the UI). 

## Existing Infrastructure Found
After a comprehensive audit of the `package.json`, environment configurations, and source code:
1. **Email Provider Configuration:** None. (No SendGrid, Resend, Mailgun, or AWS SES configured).
2. **Email Utility Modules:** None. (No `src/lib/email` exists).
3. **Environment Variables:** None in `.env`, `.env.example`, or `.env.local` related to SMTP or email API keys.
4. **Invitation Creation Flow:** `src/modules/invitations/lib/create-invitation.ts` correctly creates the database record, hash, and an in-app notification if the user exists, but it *never calls* any external email delivery service.

## Missing Pieces
1. **Email Service Provider (ESP):** We need a third-party service to reliably deliver transactional emails (e.g., Resend, Postmark, SendGrid).
2. **Email Utility Library:** A wrapper function (e.g., `sendEmail(to, subject, html)`) to interface with the ESP.
3. **Email Templates:** HTML/Text templates for the invitation email, including the magic link construct: `${NEXT_PUBLIC_APP_URL}/invitations/${rawToken}`.
4. **API Integration:** The `POST /api/business/[businessId]/invitations` route must be updated to call the email utility using the generated `rawToken`.

## Recommended Implementation Approach
1. **Choose an ESP:** [Resend](https://resend.com/) is highly recommended for modern Next.js applications due to its developer experience and React Email compatibility.
2. **Install Dependencies:** `npm install resend` (and optionally `npm install @react-email/components` if we want component-based email templates).
3. **Create Email Utility:** Create `src/lib/email/send-email.ts` to encapsulate the Resend SDK.
4. **Create Templates:** Create `src/lib/email/templates/invitation.ts` to generate the HTML payload for the invitation.
5. **Update API Route:** Modify `src/app/api/business/[businessId]/invitations/route.ts` to dispatch the email *after* successfully generating the invitation token. It is better to await the email dispatch or handle it via a background job, but a simple synchronous `await sendEmail(...)` will work for the MVP.

## Required Environment Variables
The following will need to be added to `.env.example` and the deployment environment:
```env
# ─── Email Configuration (e.g., Resend) ───
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Security Considerations
1. **Token Exposure:** The email contains the raw token (`rawToken`). This token grants access to the business under the assigned role. 
2. **Transport Security:** Emails are sent over SMTP/TLS, but are inherently insecure at rest in the user's inbox.
3. **Expiration:** Tokens are correctly configured to expire after 7 days (implemented in `create-invitation.ts`).
4. **Idempotency/Replays:** If the email is intercepted, the attacker could try to use the token. However, `accept-invitation` requires the user to be authenticated and consumes the token upon use, which mitigates replay attacks. The email should clearly state that the recipient needs to log in or create an account to accept the invitation.
