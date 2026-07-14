# Email Setup Guide

Project Atlas uses **Resend** for transactional email delivery.

## Local Development (Sandbox Limitations)
By default, if you use a newly created Resend API key without verifying a domain, you are in **Sandbox Mode**.
- In Sandbox Mode, the `EMAIL_FROM_ADDRESS` defaults to `onboarding@resend.dev`.
- **CRITICAL RESTRICTION**: You can ONLY send emails to the email address associated with your Resend account.
- If you attempt to send an invitation to an arbitrary user (e.g. `test@example.com`), Resend will silently swallow the email or throw a validation error.

To test locally:
1. Ensure `RESEND_API_KEY` is set in `.env.local`.
2. Set `EMAIL_FROM_ADDRESS=onboarding@resend.dev`.
3. Only invite your *own* email address.

## Production Setup (Domain Verification)
To send emails to any user, you must verify your domain in Resend.

1. Navigate to the **Domains** section in your [Resend Dashboard](https://resend.com/domains).
2. Click **Add Domain** and enter your production domain (e.g., `projectatlas.app`).
3. Resend will provide a set of DNS records (TXT and MX). 
4. Add these DNS records to your domain provider (e.g., Vercel, Route53, Cloudflare).
5. Once verified (usually within a few minutes), update your production environment variables:

```env
# Use your verified domain email
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

With a verified domain, Project Atlas can successfully dispatch invitation emails to any valid email address on the internet.
