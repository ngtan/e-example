// src/lib/http/index.ts
export * from './types';
export * from './errors';
export * from './utils';
export * from './retry';
export * from './client';

// Default instance export
// export const httpClient = new HttpClientImpl(
//   Container.getInstance().get<ConfigManager>('config'),
//   Container.getInstance().get<MonitoringSystem>('monitoring'),
//   Container.getInstance().get<CacheManager>('cache'),
//   Container.getInstance().get<AuthManager>('auth')
// );
