// src/lib/core/di/errors.ts
export class DIError extends Error {
  constructor(message: string, public readonly metadata?: Record<string, any>) {
    super(message);
    this.name = 'DIError';
  }
}

export class ServiceNotFoundError extends DIError {
  constructor(token: string) {
    super(`No provider registered for '${token}'`, { token });
    this.name = 'ServiceNotFoundError';
  }
}

export class CircularDependencyError extends DIError {
  constructor(tokens: string[]) {
    super(
      `Circular dependency detected: ${tokens.join(' -> ')}`,
      { tokens }
    );
    this.name = 'CircularDependencyError';
  }
}
