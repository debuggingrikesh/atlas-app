import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@projectatlas.app';

// Initialize Resend client only if API key is provided
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  console.info('[Email] Dispatching email...', {
    recipient: options.to,
    sender: emailFromAddress,
    subject: options.subject,
    hasApiKey: !!resendApiKey,
  });

  if (!resend) {
    console.warn('[Email] Skipped. RESEND_API_KEY is not configured.');
    return { success: false, error: 'Email provider not configured.' };
  }

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
  } catch (error: unknown) {
    console.error('[Email] Unexpected Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Internal error sending email.' };
  }
}