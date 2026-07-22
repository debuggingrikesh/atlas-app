import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

const mockHeaders = new Map();

vi.mock('next/headers', () => ({
  headers: vi.fn(() => mockHeaders),
}));

vi.mock('@/lib/api/response', () => ({
  successResponse: vi.fn((data) => ({ status: 200, data })),
  errorResponse: vi.fn((code, msg, status) => ({ status, error: msg })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockProcessEnv = { ...process.env };

describe('App Core Route Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    process.env = { ...mockProcessEnv };
    process.env.INTERNAL_INTEGRITY_SECRET = 'valid_secret';
  });

  it('fails with missing authorization header', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('fails with invalid format', async () => {
    mockHeaders.set('authorization', 'invalid_format');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('fails with incorrect secret', async () => {
    mockHeaders.set('authorization', 'Bearer invalid_secret');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('succeeds with correct secret', async () => {
    mockHeaders.set('authorization', 'Bearer valid_secret');
    const res = await GET();
    expect(res.status).toBe(200);
  });
  
  it('fails if server misconfigured (no internal secret)', async () => {
    delete process.env.INTERNAL_INTEGRITY_SECRET;
    mockHeaders.set('authorization', 'Bearer valid_secret');
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
