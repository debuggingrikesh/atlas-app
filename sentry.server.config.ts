import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  
  // Tracing
  tracesSampleRate: 1.0, 
  
  // Only enable in production unless explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true',

  beforeSend(event) {
    if (event.request?.url?.includes('/api/health')) return null;
    return event;
  },
});
