// src/lib/http/types.ts
import { AxiosRequestConfig, AxiosError } from 'axios';

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig extends Omit<AxiosRequestConfig, 'url' | 'method' | 'data'> {
  retry?: RetryConfig;
  cache?: CacheConfig;
  timeout?: number;
}

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
}

export interface CacheConfig {
  ttl?: number;
  key?: string;
  invalidate?: boolean;
}
