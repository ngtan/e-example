// src/lib/config.ts
import { AppConfig } from '@/types';

export const config: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
    }
  },
  features: {
    auth: true,
    analytics: true
  }
};
