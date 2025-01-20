// src/types/index.ts
import type { RetryConfig } from '../lib/http/types';

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retry: RetryConfig;
  };
  features: {
    auth: boolean;
    analytics: boolean;
  };
}
