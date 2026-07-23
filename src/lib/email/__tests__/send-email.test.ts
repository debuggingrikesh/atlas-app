import { vi, describe, it, expect, beforeEach } from 'vitest';
import { sendEmail } from '../send-email';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

vi.mock('resend', () => {
  const mockSend = vi.fn();
  return {
    Resend: class {
      emails = { send: mockSend };
    }
  };
});

vi.mock('@/lib/env.server', () => ({
  getEmailEnv: vi.fn().mockReturnValue({ RESEND_API_KEY: 'test-key', EMAIL_FROM_ADDRESS: 'test@example.com' })
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('sendEmail Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails safely without crashing when Resend API fails', async () => {
    const mockResend = new Resend('test');
    vi.mocked(mockResend.emails.send).mockResolvedValueOnce({ error: { name: 'ResendError', message: 'Rate limit' } } as unknown as never);

    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Test</p>' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Rate limit');
    expect(logger.error).toHaveBeenCalled();
    // Verify recipient email is NOT logged on error for privacy
    expect(logger.error).not.toHaveBeenCalledWith(expect.objectContaining({ recipient: expect.anything() }));
  });

  it('handles unexpected exceptions safely', async () => {
    const mockResend = new Resend('test');
    vi.mocked(mockResend.emails.send).mockRejectedValueOnce(new Error('Network offline'));

    const result = await sendEmail({ to: 'user@test.com', subject: 'Test', html: '<p>Test</p>' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal error sending email.');
    expect(logger.error).toHaveBeenCalled();
  });
});
