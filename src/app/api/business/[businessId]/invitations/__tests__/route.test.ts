import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextResponse } from 'next/server';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/auth/require-auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, errorRes: null }),
}));

vi.mock('@/lib/auth/require-permission', () => ({
  requirePermission: vi.fn().mockResolvedValue({ errorRes: null }),
}));

vi.mock('@/modules/invitations/lib/get-invitations', () => ({
  getInvitations: vi.fn().mockResolvedValue([{ id: 'inv-1' }]),
}));

vi.mock('@/lib/api/response', () => ({
  successResponse: vi.fn((data, status = 200) => {
    return NextResponse.json(data, { status });
  }),
  errorResponse: vi.fn((code, msg, status) => {
    return NextResponse.json({ error: { code, message: msg } }, { status });
  }),
}));

describe('Invitations GET Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invitations and includes x-request-id', async () => {
    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'my-custom-id' })
    });
    
    const context = { params: Promise.resolve({ businessId: 'bus-1' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('my-custom-id');
    
    const json = await res.json();
    expect(json.invitations).toEqual([{ id: 'inv-1' }]);
  });

  it('generates fallback x-request-id if missing or malformed', async () => {
    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'invalid@id' }) // @ fails regex
    });
    
    const context = { params: Promise.resolve({ businessId: 'bus-1' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(200);
    const generatedId = res.headers.get('x-request-id');
    expect(generatedId).toBeTruthy();
    expect(generatedId).not.toBe('invalid\nid');
  });

  it('retains x-request-id on mapped errors', async () => {
    // Mock requireAuth to fail
    const { requireAuth } = await import('@/lib/auth/require-auth');
    
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: null,
      errorRes: NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Failed' } }, { status: 401 })
    } as never);

    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'err-req-id' })
    });
    
    const context = { params: Promise.resolve({ businessId: 'bus-1' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(401);
    expect(res.headers.get('x-request-id')).toBe('err-req-id');
  });
});
