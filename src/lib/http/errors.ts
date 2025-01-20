// src/lib/http/errors.ts
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly metadata: Record<string, any> = {},
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'HttpError';
    if (cause) {
      this.cause = cause;
    }
  }
}

export class NetworkError extends HttpError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, metadata);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, public readonly errors?: any) {
    super(message, { errors });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends HttpError {
  constructor(message: string, cause?: Error) {
    super(message, undefined, cause);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends HttpError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends HttpError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends HttpError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, metadata);
    this.name = 'ServerError';
  }
}

