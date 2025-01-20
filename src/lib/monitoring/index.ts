// src/lib/monitoring/index.ts

import type { LogEntry, LogLevel } from '../types/logging';

export interface Span {
  id: string;
  start: number;
  end?: number;
  name: string;
  attributes: Record<string, unknown>;
  events: SpanEvent[];
  parent?: string;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

export class Tracer {
  private spans = new Map<string, Span>();
  private currentSpanId?: string;

  startSpan(name: string, attributes: Record<string, unknown> = {}): string {
    const spanId = crypto.randomUUID();
    const span: Span = {
      id: spanId,
      start: performance.now(),
      name,
      attributes,
      events: [],
      parent: this.currentSpanId
    };

    this.spans.set(spanId, span);
    this.currentSpanId = spanId;

    return spanId;
  }

  endSpan(spanId: string, metadata?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.end = performance.now();
      if (span.parent) {
        this.currentSpanId = span.parent;
      } else {
        this.currentSpanId = undefined;
      }
    }
  }

  addEvent(spanId: string, name: string, attributes: Record<string, unknown> = {}): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({
        name,
        timestamp: performance.now(),
        attributes
      });
    }
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  clear(): void {
    this.spans.clear();
    this.currentSpanId = undefined;
  }
}

export class Metrics {
  private metrics = new Map<string, number[]>();

  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetric(name: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

export class Logger {
  private logs: LogEntry[] = [];

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };

    this.logs.push(entry);
    this.writeToConsole(entry);
  }

  private writeToConsole(entry: LogEntry): void {
    const contextStr = entry.context ? JSON.stringify(entry.context) : '';
    console[entry.level](
      `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message} ${contextStr}`
    );
  }
}

export interface MonitoringSystem {
  tracer: Tracer;
  metrics: Metrics;
  logger: Logger;
}

export function createMonitoringSystem(): MonitoringSystem {
  return {
    tracer: new Tracer(),
    metrics: new Metrics(),
    logger: new Logger()
  };
}
