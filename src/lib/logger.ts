type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, payload: LogPayload | string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const message = typeof payload === 'string' ? payload : payload.message;
    const context = typeof payload === 'string' ? {} : payload;
    
    // In production, you might want to send this to Datadog/Sentry/Axiom
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      ...(args.length ? { args } : {})
    };

    if (process.env.NODE_ENV === 'production') {
      console[level](JSON.stringify(logData));
    } else {
      console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, context, ...args);
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
      this.log('error', { message: payload.message, stack: payload.stack }, ...args);
    } else {
      this.log('error', payload, ...args);
    }
  }
}

export const logger = new Logger();
