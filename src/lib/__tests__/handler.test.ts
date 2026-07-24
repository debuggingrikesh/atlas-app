import { describe, it, expect, vi } from 'vitest';
import { withErrorHandling, resolveRequestId } from '../api/handler';
import { AppError, AuthenticationError } from '../errors';
import { NextResponse } from 'next/server';

describe('resolveRequestId', () => {
  it('reuses valid incoming request ID', () => {
    const id = 'valid-id-123.45_67';
    expect(resolveRequestId(id)).toBe(id);
  });

  it('generates UUID if missing', () => {
    const id = resolveRequestId(null);
    expect(id).toMatch(/^[a-f0-9-]{36}$/); // basic UUID check
  });

  it('rejects invalid characters (newlines) and generates UUID', () => {
    const malicious = 'valid-id\nmalicious';
    const id = resolveRequestId(malicious);
    expect(id).not.toBe(malicious);
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('rejects excessively long ID', () => {
    const longId = 'a'.repeat(65);
    const id = resolveRequestId(longId);
    expect(id).not.toBe(longId);
  });
});

describe('withErrorHandling', () => {
  it('preserves existing successful response status and body', async () => {
    const mockHandler = async (req: Request) => {
      return NextResponse.json({ success: true }, { status: 201 });
    };
    
    const wrapped = withErrorHandling(mockHandler, 'test-route');
    const req = new Request('http://localhost', {
      headers: new Headers({ 'x-request-id': 'my-req-id' })
    });
    
    const response = await wrapped(req, {});
    expect(response.status).toBe(201);
    
    const json = await response.json();
    expect(json).toEqual({ success: true });
    expect(response.headers.get('x-request-id')).toBe('my-req-id');
  });

  it('converts thrown AppError into safe response', async () => {
    const mockHandler = async () => {
      throw new AuthenticationError();
    };
    
    const wrapped = withErrorHandling(mockHandler, 'test-route');
    const req = new Request('http://localhost');
    
    const response = await wrapped(req, {});
    expect(response.status).toBe(401);
    
    const json = await response.json();
    expect(json.error.code).toBe('AUTHENTICATION_ERROR');
    expect(json.error.message).toBe('Authentication failed');
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('converts unknown error into safe 500 response', async () => {
    const mockHandler = async () => {
      throw new Error('Database password is 123');
    };
    
    const wrapped = withErrorHandling(mockHandler, 'test-route');
    const req = new Request('http://localhost');
    
    const response = await wrapped(req, {});
    expect(response.status).toBe(500);
    
    const json = await response.json();
    expect(json.error.code).toBe('UNKNOWN_ERROR');
    expect(json.error.message).toBe('Internal Server Error');
    expect(JSON.stringify(json)).not.toContain('password');
  });

  it('preserves custom headers on success', async () => {
    const mockHandler = async (req: Request) => {
      const resp = NextResponse.json({ ok: true });
      resp.headers.set('X-Custom-Header', 'custom-value');
      return resp;
    };
    
    const wrapped = withErrorHandling(mockHandler, 'test-route');
    const req = new Request('http://localhost');
    
    const response = await wrapped(req, {});
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('forwards dynamic params and context correctly', async () => {
    interface TestContext {
      params: Promise<{ id: string }>;
    }
    const mockHandler = async (req: Request, ctx: TestContext) => {
      const { id } = await ctx.params;
      return NextResponse.json({ receivedId: id });
    };

    const wrapped = withErrorHandling<TestContext>(mockHandler, 'test-route');
    const req = new Request('http://localhost');
    const context = { params: Promise.resolve({ id: 'test-123' }) };

    const response = await wrapped(req, context);
    const json = await response.json();
    expect(json.receivedId).toBe('test-123');
  });

  it('supports request-only handlers without context', async () => {
    const mockHandler = async (req: Request) => {
      return NextResponse.json({ url: req.url });
    };

    const wrapped = withErrorHandling(mockHandler, 'test-route');
    const req = new Request('http://localhost/test');

    const response = await wrapped(req, {});
    const json = await response.json();
    expect(json.url).toBe('http://localhost/test');
  });
});
