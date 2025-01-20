// src/lib/http/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { HttpClient, RequestConfig, RetryConfig } from './types';
import { RetryStrategy } from './retry';
import { generateRequestId } from './utils';
import {
  HttpError, NetworkError, ValidationError, AuthenticationError,
  AuthorizationError, NotFoundError, ConflictError, RateLimitError, ServerError
} from './errors';
import { ConfigManager } from '../types/config';
import { AuthManager } from '../types/auth';
import { MonitoringSystem } from '../monitoring';
import { CacheManager } from '../cache';

export interface HttpClientConfig {
  baseURL?: string;
  defaultTimeout?: number;
  defaultHeaders?: Record<string, string>;
  retry?: RetryConfig;
}

export class HttpClientImpl implements HttpClient {
  private axiosInstance: AxiosInstance;
  private retryStrategy: RetryStrategy;

  constructor(
    private readonly config: ConfigManager,
    private readonly monitoring: MonitoringSystem,
    private readonly cache: CacheManager,
    private readonly auth?: AuthManager,
    clientConfig: HttpClientConfig = {}
  ) {
    this.axiosInstance = axios.create({
      baseURL: clientConfig.baseURL || config.get('api.baseUrl'),
      timeout: clientConfig.defaultTimeout || config.get('api.timeout', 30000),
      headers: {
        'Content-Type': 'application/json',
        ...clientConfig.defaultHeaders
      },
    });

    this.retryStrategy = new RetryStrategy({
      maxAttempts: config.get('api.retry.maxAttempts', 3),
      baseDelay: config.get('api.retry.baseDelay', 1000),
      maxDelay: config.get('api.retry.maxDelay', 5000),
      ...clientConfig.retry
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          return await this.handleRequest(config);
        } catch (error) {
          return Promise.reject(error);
        }
      },
      (error) => this.handleRequestError(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => this.handleResponse(response),
      async (error) => this.handleResponseError(error)
    );
  }

  private async handleRequest(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    const requestId = generateRequestId();
    const spanId = this.monitoring.tracer.startSpan('http.request', {
      requestId,
      url: config.url,
      method: config.method,
    });

    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId,
      'X-Trace-ID': spanId,
      'X-Client-Version': this.config.get('app.version'),
    };

    if (this.auth) {
      try {
        const token = await this.auth.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        this.monitoring.logger.log('error', 'Failed to get auth token', { error });
      }
    }

    // Add timing info for response handling
    config.metadata = {
      startTime: Date.now(),
      spanId,
      requestId,
    };

    return config;
  }

  private handleRequestError(error: any): Promise<never> {
    this.monitoring.logger.log('error', 'Request interceptor error', { error });
    return Promise.reject(new NetworkError('Request failed', { cause: error }));
  }

  private async handleResponse(response: AxiosResponse): Promise<any> {
    const { startTime, spanId } = response.config.metadata || {};
    
    if (spanId) {
      this.monitoring.tracer.endSpan(spanId, {
        status: response.status,
        duration: Date.now() - (startTime || Date.now()),
      });
    }

    // Cache handling
    const cacheConfig = response.config.cache;
    if (cacheConfig?.key && response.data) {
      try {
        await this.cache.getOrSet(
          cacheConfig.key,
          async () => response.data,
          cacheConfig.ttl
        );
      } catch (error) {
        this.monitoring.logger.log('warn', 'Cache write failed', { error });
      }
    }

    return response.data;
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const { spanId } = error.config?.metadata || {};
    
    if (spanId) {
      this.monitoring.tracer.endSpan(spanId, {
        error: error.message,
        status: error.response?.status,
      });
    }

    // Authentication error handling
    if (error.response?.status === 401 && this.auth) {
      try {
        const newToken = await this.auth.refreshToken();
        if (newToken && error.config) {
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          // Changed return type from never to any
          return await this.axiosInstance.request(error.config);
        }
      } catch (refreshError) {
        this.auth.clearTokens();
        throw new AuthenticationError('Session expired', 
          refreshError instanceof Error ? refreshError : new Error(String(refreshError))
        );
      }
    }

    // Retry handling
    const retryConfig = error.config?.retry ?? this.config.get('api.retry');
    if (this.shouldRetry(error, retryConfig)) {
      return this.retryStrategy.execute(() => 
        this.axiosInstance.request(error.config!)
      );
    }

    throw this.mapError(error);
  }

  private shouldRetry(error: AxiosError, config?: RetryConfig): boolean {
    if (config?.shouldRetry) {
      return config.shouldRetry(error);
    }

    // Default retry strategy
    return !error.response || [408, 429, 500, 502, 503, 504].includes(
      error.response.status
    );
  }

  private mapError(error: AxiosError): Error {
    const baseError = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      cause: error,
    };

    this.monitoring.logger.log('error', 'HTTP request failed', baseError);

    if (!error.response) {
      return new NetworkError('Network error', baseError);
    }

    switch (error.response.status) {
      case 400:
        return new ValidationError('Invalid request', error.response.data);
      case 401:
        return new AuthenticationError('Unauthorized');
      case 403:
        return new AuthorizationError('Forbidden');
      case 404:
        return new NotFoundError('Resource not found');
      case 409:
        return new ConflictError('Resource conflict');
      case 429:
        return new RateLimitError('Too many requests');
      default:
        return error.response.status >= 500
          ? new ServerError('Server error', baseError)
          : new HttpError('HTTP error', baseError);
    }
  }

  async request<T>(config: RequestConfig & { method: string }): Promise<T> {
    if (config.cache?.key && !config.cache?.invalidate) {
      // const cached = await this.cache.get<T>(config.cache.key);
      const cached = await this.cache.getOrSet(
        config.cache.key,
        async () => undefined, // TODO
        // async () => response.data, // TODO
        // config.cache.ttl
      );
      if (cached) return cached;
    }

    return this.axiosInstance.request<T, T>({
      ...config,
      headers: {
        ...this.getDefaultHeaders(),
        ...config.headers,
      },
    });
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  private getDefaultHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Version': this.config.get('app.version'),
    };
  }
}

