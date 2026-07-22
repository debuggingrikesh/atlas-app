import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { logger } from '../logger';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setUser: vi.fn(),
      setExtras: vi.fn(),
    };
    callback(scope);
  }),
}));

describe('Logger Sentry Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ENABLE_SENTRY: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('captures unhandled exceptions correctly', () => {
    const error = new Error('Test Exception');
    logger.error(error);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('captures error messages correctly', () => {
    logger.error('Something went wrong');
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect((Sentry.captureException as any).mock.calls[0][0].message).toBe('Something went wrong');
  });

  it('attaches user context and request ID', () => {
    logger.error({ 
      message: 'Failed to process', 
      userId: 'user_123', 
      requestId: 'req_abc',
      tenantId: 'tenant_xyz'
    });

    const withScopeMock = vi.mocked(Sentry.withScope);
    expect(withScopeMock).toHaveBeenCalled();
    
    // the callback gives a mock scope
    const scopeMock = withScopeMock.mock.calls[0][0];
    const dummyScope = { setTag: vi.fn(), setUser: vi.fn(), setExtras: vi.fn() };
    // @ts-expect-error test mock typing
    scopeMock(dummyScope as unknown as Sentry.Scope);

    expect(dummyScope.setTag).toHaveBeenCalledWith('requestId', 'req_abc');
    expect(dummyScope.setUser).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user_123',
      tenantId: 'tenant_xyz'
    }));
  });

  it('ignores expected operational errors', () => {
    logger.error({ message: 'Not found', status: 404 });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();

    logger.error({ message: 'Validation failed', code: 'VALIDATION_ERROR' });
    expect(Sentry.captureException).not.toHaveBeenCalled();

    logger.error(new Error('Request cancelled by user'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
