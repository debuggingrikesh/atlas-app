import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyInternalRequest } from '../internal';
import { headers } from 'next/headers';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('verifyInternalRequest', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  const mockHeaders = (authHeaderValue: string | null) => {
    (headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue(authHeaderValue),
    });
  };

  it('valid primary secret succeeds', async () => {
    process.env.HQ_INTERNAL_API_SECRET = 'primary-secret';
    mockHeaders('Bearer primary-secret');
    const result = await verifyInternalRequest();
    expect(result).toBe(true);
  });

  it('valid previous secret succeeds', async () => {
    process.env.HQ_INTERNAL_API_SECRET = 'primary-secret';
    process.env.HQ_INTERNAL_API_SECRET_PREVIOUS = 'previous-secret';
    mockHeaders('Bearer previous-secret');
    const result = await verifyInternalRequest();
    expect(result).toBe(true);
  });

  it('incorrect secret fails', async () => {
    process.env.HQ_INTERNAL_API_SECRET = 'primary-secret';
    mockHeaders('Bearer wrong-secret');
    const result = await verifyInternalRequest();
    expect(result).toBe(false);
  });

  it('empty previous secret cannot authenticate Bearer ', async () => {
    process.env.HQ_INTERNAL_API_SECRET = 'primary-secret';
    process.env.HQ_INTERNAL_API_SECRET_PREVIOUS = '';
    mockHeaders('Bearer ');
    const result = await verifyInternalRequest();
    expect(result).toBe(false);
  });

  it('whitespace-only previous secret cannot authenticate', async () => {
    process.env.HQ_INTERNAL_API_SECRET = 'primary-secret';
    process.env.HQ_INTERNAL_API_SECRET_PREVIOUS = '   ';
    mockHeaders('Bearer ');
    const result = await verifyInternalRequest();
    expect(result).toBe(false);
  });

  it('missing primary secret fails safely', async () => {
    delete process.env.HQ_INTERNAL_API_SECRET;
    mockHeaders('Bearer something');
    const result = await verifyInternalRequest();
    expect(result).toBe(false);
  });
});
