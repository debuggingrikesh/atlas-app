export class AppError extends Error {
  public code: string;
  public status: number;
  public safeMessage: string;

  constructor(message: string, code: string, status: number, safeMessage?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.safeMessage = safeMessage || message;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, safeMessage?: string) {
    super(message, 'VALIDATION_ERROR', 400, safeMessage);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, 'Internal Server Error');
    this.name = 'ConfigurationError';
  }
}

export class RateLimitConfigError extends ConfigurationError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitConfigError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, 'Authentication failed');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, 'Permission denied');
    this.name = 'AuthorizationError';
  }
}

export class AIConfigurationError extends ConfigurationError {
  constructor(message: string) {
    super(message);
    this.name = 'AIConfigurationError';
  }
}

export class EmailConfigurationError extends ConfigurationError {
  constructor(message: string) {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500, 'Internal Server Error');
    this.name = 'DatabaseError';
  }
}

export class UnknownError extends AppError {
  constructor(message: string) {
    super(message, 'UNKNOWN_ERROR', 500, 'Internal Server Error');
    this.name = 'UnknownError';
  }
}

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }
  
  if (err instanceof Error) {
    // Detect Prisma errors
    if (err.name.startsWith('PrismaClient') || err.message.includes('prisma')) {
      return new DatabaseError(err.message);
    }
    
    // Detect Zod errors (commonly named ZodError)
    if (err.name === 'ZodError' || err.message.includes('validation failed')) {
      return new ValidationError(err.message, 'Invalid request data');
    }

    // Rate Limit Config
    if (err.name === 'RateLimitConfigError') {
      return new RateLimitConfigError(err.message);
    }

    return new UnknownError(err.message);
  }

  return new UnknownError(String(err));
}

export function safeErrorResponse(err: unknown) {
  const normalized = normalizeError(err);
  return {
    error: {
      code: normalized.code,
      message: normalized.safeMessage,
    }
  };
}
