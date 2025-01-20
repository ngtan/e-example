// src/lib/core/business.ts
import { Result, PaginatedResult, QueryOptions } from '../../types';
import { MonitoringSystem } from '../monitoring';
import { CacheManager } from '../cache';

export interface RetryOptions {
  maxAttempts: number;
  shouldRetry: (error: Error) => boolean;
  getDelayMs: (attempt: number) => number;
}

export interface ValidationRule {
  validate(): Promise<ValidationResult>;
}

export interface Validator {
  validate(): Promise<ValidationResult>;
}

export interface BusinessOperation<T> {
  execute(): Promise<Result<T>>;
}

export class BusinessOperationBuilder<T> {
  private cacheKey?: string;
  private cacheOptions?: CacheOptions;
  private retryOptions?: RetryOptions;
  private validationRules?: ValidationRule[];

  constructor(
    private operation: () => Promise<T>,
    private monitoring: MonitoringSystem,
    private cacheManager: CacheManager
  ) {}

  withCache(key: string, options?: CacheOptions): this {
    this.cacheKey = key;
    this.cacheOptions = options;
    return this;
  }

  withRetry(options: RetryOptions): this {
    this.retryOptions = options;
    return this;
  }

  withValidation(rules: ValidationRule[]): this {
    this.validationRules = rules;
    return this;
  }

  async execute(): Promise<Result<T>> {
    const spanId = this.monitoring.tracer.startSpan('business.operation');

    try {
      if (this.validationRules) {
        const validationResult = await this.validate();
        if (!validationResult.success) {
          throw new ValidationError(validationResult.errors);
        }
      }

      console.log({ cacheKey: this.cacheKey });

      const result = this.cacheKey
        ? await this.executeWithCache()
        : await this.executeWithRetry();

      return {
        success: true,
        data: result,
        metadata: {
          spanId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.monitoring.logger.error('Business operation failed', { error });
      return {
        success: false,
        error: error as Error,
        metadata: {
          spanId,
          timestamp: new Date()
        }
      };
    } finally {
      this.monitoring.tracer.endSpan(spanId);
    }
  }

  private async executeWithCache(): Promise<T> {
    return this.cacheManager.getOrSet(
      this.cacheKey!,
      () => this.executeWithRetry(),
      this.cacheOptions
    );
  }

  private async executeWithRetry(): Promise<T> {
    if (!this.retryOptions) {
      return this.operation();
    }

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retryOptions.maxAttempts; attempt++) {
      try {
        return await this.operation();
      } catch (error) {
        lastError = error as Error;
        if (
          attempt === this.retryOptions.maxAttempts ||
          !this.retryOptions.shouldRetry(lastError)
        ) {
          throw lastError;
        }
        await this.delay(this.retryOptions.getDelayMs(attempt));
      }
    }

    throw lastError || new Error('Operation failed');
  }

  private async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    
    for (const rule of this.validationRules!) {
      const result = await rule.validate();
      if (!result.success) {
        errors.push(...result.errors);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export abstract class BaseBusinessService {
  constructor(
    protected monitoring: MonitoringSystem,
    protected cacheManager: CacheManager
  ) {}

  protected createOperation<T>(
    operation: () => Promise<T>
  ): BusinessOperationBuilder<T> {
    return new BusinessOperationBuilder(
      operation,
      this.monitoring,
      this.cacheManager
    );
  }
}
