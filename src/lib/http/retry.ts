// src/lib/http/retry.ts
import axios, { AxiosError } from 'axios';
import { RetryConfig } from './types';
import { NetworkError } from './errors';

export class RetryStrategy {
  private readonly defaultConfig: Required<RetryConfig> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    shouldRetry: this.defaultShouldRetry
  };

  constructor(private readonly config: RetryConfig = {}) {
    this.config = {
      ...this.defaultConfig,
      ...config
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    let attempt = 1;

    const { maxAttempts, shouldRetry } = this.config as Required<RetryConfig>;

    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!shouldRetry(lastError) || attempt === maxAttempts) {
          throw lastError;
        }

        await this.delay(this.calculateDelay(attempt));
        attempt++;
      }
    }

    throw lastError!;
  }

  private defaultShouldRetry(error: Error): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Don't retry on client errors (except specific cases)
      if (axiosError.response?.status) {
        if (axiosError.response.status === 404) return false;
        if (axiosError.response.status === 401) return false;
        if (axiosError.response.status === 403) return false;
        if (axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return [408, 429].includes(axiosError.response.status);
        }
      }
      // Retry on network errors or server errors
      return !axiosError.response || axiosError.response.status >= 500;
    }
    return error instanceof NetworkError;
  }

  private calculateDelay(attempt: number): number {
    const { baseDelay, maxDelay } = this.config as Required<RetryConfig>;
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 100;
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
