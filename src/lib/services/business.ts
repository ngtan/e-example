// src/lib/core/business.ts
import { Result, PaginatedResult, QueryOptions } from '../../types';
import { MonitoringSystem } from '../monitoring';
import { CacheManager } from '../cache';

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
      // Validate if rules exist
      if (this.validationRules) {
        const validationResult = await this.validate();
        if (!validationResult.success) {
          throw new ValidationError(validationResult.errors);
        }
      }

      // Execute with cache if configured
      const result = this.cacheKey
        ? await this.executeWithCache()
        : await this.executeWithRetry();

      return {
        data: result,
        metadata: {
          spanId,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.monitoring.logger.log('error', 'Business operation failed', { error });
      return {
        data: null as any,
        error: error as Error
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

    for (let attempt = 1; attempt <= this.retryOptions.maxAttempts; attempt++) {
      try {
        return await this.operation();
      } catch (error) {
        if (
          attempt === this.retryOptions.maxAttempts ||
          !this.retryOptions.shouldRetry(error)
        ) {
          throw error;
        }
        await this.delay(this.retryOptions.getDelayMs(attempt));
      }
    }

    throw new Error('Max retry attempts reached');
  }

  private async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
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
