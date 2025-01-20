// src/lib/types/logging.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  /** Error object if available */
  error?: Error;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Service/component name */
  service?: string;
  /** Environment (development, production, etc.) */
  environment?: string;
}

