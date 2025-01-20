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
  duration?: number;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

export interface MonitoringConfig {
  environment: string;
  version: string;
  maxLogRetention?: number;
  maxSpanRetention?: number;
  samplingRate?: number;
}

export interface MetricMetadata {
  unit?: string;
  description?: string;
  timestamp: number;
  labels: Record<string, string>;
}

export interface MetricValue {
  avg: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  sum: number;
  metadata: MetricMetadata;
}

export interface MetricsExport {
  metrics: Record<string, MetricValue>;
  timestamp: number;
  environment: string;
  version: string;
}

export class Tracer {
  private spans = new Map<string, Span>();
  private currentSpanId?: string;
  private readonly maxSpanRetention: number;

  constructor(private config: MonitoringConfig) {
    this.maxSpanRetention = config.maxSpanRetention || 30000; // 30 seconds default
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5000);
    }
  }

  private cleanup(): void {
    const now = performance.now();
    for (const [id, span] of this.spans.entries()) {
      if (span.end && (now - span.end) > this.maxSpanRetention) {
        this.spans.delete(id);
      }
    }
  }

  startSpan(name: string, attributes: Record<string, unknown> = {}): string {
    if (this.shouldSample()) {
      const spanId = crypto.randomUUID();
      const span: Span = {
        id: spanId,
        start: performance.now(),
        name,
        attributes: {
          ...attributes,
          environment: this.config.environment,
          version: this.config.version,
          traceId: crypto.randomUUID()
        },
        events: [],
        parent: this.currentSpanId
      };

      this.spans.set(spanId, span);
      this.currentSpanId = spanId;
      return spanId;
    }
    return '';
  }

  private shouldSample(): boolean {
    return Math.random() < (this.config.samplingRate ?? 1.0);
  }

  endSpan(spanId: string, attributes: Record<string, unknown> = {}): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.end = performance.now();
      span.duration = span.end - span.start;
      span.attributes = {
        ...span.attributes,
        ...attributes,
        duration: span.duration
      };

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
        attributes: {
          ...attributes,
          environment: this.config.environment
        }
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

  exportSpans(): Span[] {
    return Array.from(this.spans.values());
  }
}

export class Metrics {
  private metrics = new Map<string, {
    values: number[];
    metadata: MetricMetadata;
  }>();

  constructor(private config: MonitoringConfig) {}

  record(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        values: [],
        metadata: {
          timestamp: Date.now(),
          labels: {
            ...labels,
            environment: this.config.environment,
            version: this.config.version
          }
        }
      });
    }
    
    const metric = this.metrics.get(name)!;
    metric.values.push(value);
    metric.metadata.timestamp = Date.now();
  }

  getMetric(name: string): MetricValue | null {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) {
      return null;
    }

    const sortedValues = [...metric.values].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedValues.length * 0.95);
    const sum = metric.values.reduce((a, b) => a + b, 0);

    return {
      avg: sum / metric.values.length,
      min: Math.min(...metric.values),
      max: Math.max(...metric.values),
      count: metric.values.length,
      p95: sortedValues[p95Index],
      sum,
      metadata: metric.metadata
    };
  }

  exportMetrics(): MetricsExport {
    const metrics: Record<string, MetricValue> = {};
    
    for (const [name] of this.metrics.entries()) {
      const metricValue = this.getMetric(name);
      if (metricValue) {
        metrics[name] = metricValue;
      }
    }

    return {
      metrics,
      timestamp: Date.now(),
      environment: this.config.environment,
      version: this.config.version
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

export class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs: number;

  constructor(private config: MonitoringConfig) {
    this.maxLogs = config.maxLogRetention || 1000;
  }

  log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: {
        ...context,
        environment: this.config.environment,
        version: this.config.version
      }
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.writeToConsole(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private writeToConsole(entry: LogEntry): void {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const message = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  exportLogs(): LogEntry[] {
    return this.getLogs();
  }
}

export interface MonitoringSystem {
  tracer: Tracer;
  metrics: Metrics;
  logger: Logger;
}

export function createMonitoring(config: MonitoringConfig): MonitoringSystem {
  return {
    tracer: new Tracer(config),
    metrics: new Metrics(config),
    logger: new Logger(config)
  };
}
