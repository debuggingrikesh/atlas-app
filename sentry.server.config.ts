 

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  
  // Tracing
  tracesSampleRate: process.env.APP_ENV === 'production' ? 0.05 : 1.0, 
  
  // Ensure we capture traces when an error occurs, regardless of standard sampling
  // (Sentry automatically associates errors with their transaction, but we can't retrospectively sample.
  // We rely on standard tracesSampleRate for baseline and use Sentry error captures for exceptions).

  // Only enable in production unless explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true',

  beforeSend(event) {
    if (event.request?.url?.includes('/api/health')) return null;
    return event;
  },
  
  tracesSampler: (samplingContext) => {
    // Zero sampling for health check routes
    if (
      samplingContext.request?.url?.includes('/api/health') ||
      samplingContext.transactionContext?.name?.includes('/api/health')
    ) {
      return 0.0;
    }
    
    // Higher sampling rate for critical paths
    if (
      samplingContext.transactionContext?.name?.includes('/api/auth') ||
      samplingContext.transactionContext?.name?.includes('/api/business') ||
      samplingContext.transactionContext?.name?.includes('/api/subscription')
    ) {
      return process.env.APP_ENV === 'production' ? 0.2 : 1.0;
    }
    
    // Default fallback
    return process.env.APP_ENV === 'production' ? 0.05 : 1.0;
  }
});
