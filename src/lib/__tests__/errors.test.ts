import { describe, it, expect } from 'vitest';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  RateLimitConfigError, 
  ConfigurationError, 
  UnknownError,
  normalizeError,
  safeErrorResponse
} from '../errors';

describe('Error Normalization', () => {
  it('maps Zod validation error to ValidationError', () => {
    const error = new Error('validation failed on field X');
    error.name = 'ZodError';
    
    const normalized = normalizeError(error);
    expect(normalized).toBeInstanceOf(ValidationError);
    expect(normalized.status).toBe(400);
    expect(normalized.safeMessage).toBe('Invalid request data');
  });

  it('maps AuthenticationError correctly', () => {
    const error = new AuthenticationError();
    const normalized = normalizeError(error);
    expect(normalized).toBeInstanceOf(AuthenticationError);
    expect(normalized.status).toBe(401);
  });

  it('maps AuthorizationError correctly', () => {
    const error = new AuthorizationError();
    const normalized = normalizeError(error);
    expect(normalized).toBeInstanceOf(AuthorizationError);
    expect(normalized.status).toBe(403);
  });

  it('maps RateLimitConfigError correctly', () => {
    const error = new Error('UPSTASH missing');
    error.name = 'RateLimitConfigError';
    const normalized = normalizeError(error);
    expect(normalized).toBeInstanceOf(RateLimitConfigError);
    expect(normalized.status).toBe(500);
  });

  it('maps ConfigurationError safely', () => {
    const error = new ConfigurationError('Secret key leaked');
    const safeResp = safeErrorResponse(error);
    expect(safeResp.error.message).toBe('Internal Server Error');
    expect(safeResp.error.message).not.toContain('Secret key leaked');
  });

  it('maps UnknownError safely', () => {
    const error = new Error('Database password is 1234');
    const normalized = normalizeError(error);
    
    expect(normalized).toBeInstanceOf(UnknownError);
    const safeResp = safeErrorResponse(normalized);
    expect(safeResp.error.message).toBe('Internal Server Error');
    expect(safeResp.error.message).not.toContain('Database password');
  });

  it('ensures no stack or cause appears in public JSON', () => {
    const error = new Error('Something broke');
    error.cause = new Error('Inner cause');
    
    const safeResp = safeErrorResponse(error);
    expect((safeResp as Record<string, unknown>).stack).toBeUndefined();
    expect((safeResp as Record<string, unknown>).cause).toBeUndefined();
    expect(safeResp.error.message).toBe('Internal Server Error');
  });
});
