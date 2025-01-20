// src/lib/api/client.ts
import axios from 'axios';
import { config } from '@/lib/config';
import { HttpClientImpl } from '@/lib/http/client';
import { createCache } from '@/lib/cache';
import { createMonitoring } from '@/lib/monitoring';

const cache = createCache({
  storage: typeof window !== 'undefined' ? window.localStorage : null,
  prefix: 'app_cache_'
});

const monitoring = createMonitoring({
  environment: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_VERSION
});

export const apiClient = new HttpClientImpl(
  config,
  monitoring,
  cache
);
