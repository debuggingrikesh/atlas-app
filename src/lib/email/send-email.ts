/* eslint-disable @typescript-eslint/no-explicit-any */

import { Resend } from 'resend';
import { getEmailEnv } from '@/lib/env.server';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  let resendApiKey: string;
  let emailFromAddress: string;

  try {
    const env = getEmailEnv();
    resendApiKey = env.RESEND_API_KEY;
    emailFromAddress = env.EMAIL_FROM_ADDRESS || 'noreply@projectatlas.app';
  } catch (err: any) {
    console.warn('[Email] Skipped. Email provider not configured:', err.message);
    return { success: false, error: 'Email provider not configured.' };
  }

  const resend = new Resend(resendApiKey);

  console.info('[Email] Dispatching email...', {
    recipient: options.to,
    sender: emailFromAddress,
    subject: options.subject,
    hasApiKey: !!resendApiKey,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: emailFromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('[Email] Resend API Error:', {
        name: error.name,
        message: error.message,
      });
      return { success: false, error: error.message };
    }

    console.info('[Email] Successfully sent.', { id: data?.id });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Email] Unexpected Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Internal error sending email.' };
  }
}