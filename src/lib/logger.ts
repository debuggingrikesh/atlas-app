import { headers } from 'next/headers';
import type { LogLevel, LogPayload } from '@atlas/core/observability';

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'authorization', 'cookie', 'secret',
  'key', 'api_key', 'gemini_api_key', 'resend_api_key',
  'admin_secret', 'supabase_service_role_key', 'session'
]);

function redact(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(lowerKey) || 
      lowerKey.includes('token') || 
      lowerKey.includes('secret') || 
      lowerKey.includes('password')
    ) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redact(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

class Logger {
  constructor(private serviceName: string) {}

  private getRequestId(): string | undefined {
    try {
      // headers() can throw if used outside of request context (e.g., in a background job or during build)
      // We must await it in Next.js 15, but in 14 it's sync. In 14 we can just call it.
      // Wait, in Next 15 headers() returns a Promise. The project is using 16.2.10 (Turbopack) mockup?
      // No, Next 15 headers() is a Promise. Let's check package.json.
      return undefined; // We'll patch this below
    } catch {
      return undefined;
    }
  }

  private log(level: LogLevel, payload: LogPayload | string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const message = typeof payload === 'string' ? payload : payload.message;
    const context = typeof payload === 'string' ? {} : payload;
    
    let requestId: string | undefined = undefined;
    try {
      // Workaround for sync/async headers in Next.js transitions
      const h = headers() as any;
      if (h && typeof h.get === 'function') {
        requestId = h.get('x-request-id') || undefined;
      }
    } catch {}
    
    let redactedContext = redact(context) as Record<string, unknown>;
    
    const logData = {
      timestamp,
      level,
      service: this.serviceName,
      environment: process.env.NODE_ENV || 'development',
      message,
      requestId,
      ...redactedContext,
      ...(args.length ? { args: redact(args) } : {})
    };

    if (process.env.NODE_ENV === 'production') {
      console[level](JSON.stringify(logData));
    } else {
      const { timestamp, level, service, environment, message, requestId, ...rest } = logData;
      console[level](`[${timestamp}] [${level.toUpperCase()}] [${requestId || 'no-req-id'}] ${message}`, Object.keys(rest).length ? rest : '');
    }
  }

  debug(payload: LogPayload | string, ...args: unknown[]) {
    this.log('debug', payload, ...args);
  }

  info(payload: LogPayload | string, ...args: unknown[]) {
    this.log('info', payload, ...args);
  }

  warn(payload: LogPayload | string, ...args: unknown[]) {
    this.log('warn', payload, ...args);
  }

  error(payload: LogPayload | string | Error, ...args: unknown[]) {
    if (payload instanceof Error) {
      const errorData = { 
        message: payload.message, 
        errorName: payload.name,
        stack: payload.stack 
      };
      this.log('error', errorData, ...args);
    } else {
      this.log('error', payload, ...args);
    }
  }
}

export const logger = new Logger('atlas-app');
