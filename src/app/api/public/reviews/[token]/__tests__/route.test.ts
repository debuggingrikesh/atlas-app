import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextResponse } from 'next/server';

vi.mock('server-only', () => ({}));

vi.mock('@/modules/reputation/services/feedback-service', () => ({
  FeedbackService: {
    getReviewRequestDetails: vi.fn(),
  },
}));

vi.mock('@/lib/api/response', () => ({
  successResponse: vi.fn((data, status = 200) => {
    return NextResponse.json(data, { status });
  }),
  errorResponse: vi.fn((code, msg, status) => {
    return NextResponse.json({ error: { code, message: msg } }, { status });
  }),
}));

describe('Public Reviews GET Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns review details and includes x-request-id', async () => {
    const { FeedbackService } = await import('@/modules/reputation/services/feedback-service');
    
    vi.mocked(FeedbackService.getReviewRequestDetails).mockResolvedValueOnce({
      // @ts-expect-error Mocking partial request object
      request: {
        business: { name: 'Acme', logoUrl: 'logo.png' },
        campaign: { name: 'Q1', googleReviewUrl: null }
      }
    });

    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'public-req-1' })
    });
    const context = { params: Promise.resolve({ token: 'tok-123' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('public-req-1');
    
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.business.name).toBe('Acme');
  });

  it('handles invalid token with x-request-id', async () => {
    const { FeedbackService } = await import('@/modules/reputation/services/feedback-service');
    
    vi.mocked(FeedbackService.getReviewRequestDetails).mockResolvedValueOnce({
      error: 'Invalid token.',
      status: 400
    });

    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'public-err-1' })
    });
    const context = { params: Promise.resolve({ token: 'bad-tok' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(400);
    expect(res.headers.get('x-request-id')).toBe('public-err-1');
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('generates fallback x-request-id if missing', async () => {
    const { FeedbackService } = await import('@/modules/reputation/services/feedback-service');
    
    vi.mocked(FeedbackService.getReviewRequestDetails).mockResolvedValueOnce({
      error: 'Invalid token.',
      status: 400
    });

    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ token: 'bad-tok' }) };
    const res = await GET(req, context);
    
    expect(res.status).toBe(400);
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});
