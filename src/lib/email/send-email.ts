import { Resend } from 'resend';
import { getEmailEnv } from '@/lib/env.server';
import { logger } from '@/lib/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a transactional email via Resend.
 *
 * Reliability notes:
 * - No retry: email sends are not idempotent. A retry after a network timeout
 *   could produce a duplicate send. Callers that need retry should implement
 *   deduplication at the application level.
 * - Configuration failure returns success=false without throwing, so callers
 *   can decide whether to treat a missing email provider as fatal.
 * - The recipient address is never logged. Only the Resend message ID and
 *   subject are logged on success. On error, only the error category is logged.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  let resendApiKey: string;
  let emailFromAddress: string;

  try {
    const env = getEmailEnv();
    resendApiKey = env.RESEND_API_KEY;
    emailFromAddress = env.EMAIL_FROM_ADDRESS || 'noreply@projectatlas.app';
  } catch (err) {
    logger.warn({
      message: 'Email send skipped: provider not configured',
      feature: 'email',
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: 'Email provider not configured.' };
  }

  const resend = new Resend(resendApiKey);

  logger.info({
    message: 'Dispatching email',
    feature: 'email',
    subject: options.subject,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: emailFromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error({
        message: 'Email send failed: Resend API error',
        feature: 'email',
        errorName: error.name,
      });
      return { success: false, error: error.message };
    }

    logger.info({
      message: 'Email dispatched successfully',
      feature: 'email',
      messageId: data?.id,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.error({
      message: 'Email send failed: unexpected error',
      feature: 'email',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return { success: false, error: 'Internal error sending email.' };
  }
}