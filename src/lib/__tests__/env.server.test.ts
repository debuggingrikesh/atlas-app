import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getInternalAuthEnv } from '../env.server';

vi.mock('server-only', () => ({}));

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('required value succeeds', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', 'valid-secret');
    const env = getInternalAuthEnv();
    expect(env.HQ_INTERNAL_API_SECRET).toBe('valid-secret');
  });

  it('empty required value fails', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', '');
    expect(() => getInternalAuthEnv()).toThrow('Internal Auth configuration missing: HQ_INTERNAL_API_SECRET is required for Internal APIs');
  });

  it('whitespace-only required value fails', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', '   ');
    expect(() => getInternalAuthEnv()).toThrow('Internal Auth configuration missing: HQ_INTERNAL_API_SECRET is required for Internal APIs');
  });

  it('optional empty previous secret becomes absent', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', 'valid-secret');
    vi.stubEnv('HQ_INTERNAL_API_SECRET_PREVIOUS', '');
    const env = getInternalAuthEnv();
    expect(env.HQ_INTERNAL_API_SECRET_PREVIOUS).toBeUndefined();
  });

  it('optional whitespace-only previous secret becomes absent', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', 'valid-secret');
    vi.stubEnv('HQ_INTERNAL_API_SECRET_PREVIOUS', '   ');
    const env = getInternalAuthEnv();
    expect(env.HQ_INTERNAL_API_SECRET_PREVIOUS).toBeUndefined();
  });

  it('thrown errors do not include secret values', () => {
    vi.stubEnv('HQ_INTERNAL_API_SECRET', '   ');
    let errorMessage = '';
    try {
      getInternalAuthEnv();
    } catch (err: unknown) {
      if (err instanceof Error) errorMessage = err.message;
    }
    expect(errorMessage).not.toContain('   ');
    expect(errorMessage).toContain('HQ_INTERNAL_API_SECRET is required');
  });
});
