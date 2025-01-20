// src/lib/core/di/index.ts
export * from './types';
export * from './errors';
export * from './container';

// Example usage with enhanced features:
/*
const container = Container.getInstance({
  strict: true,
  autoCreate: false,
  maxDepth: 10
});

// Register with dependencies
container.register('logger', () => new Logger(), { 
  singleton: true,
  dependencies: ['config']
});

// Register lazy-loaded service
container.register('heavyService', () => new HeavyService(), {
  singleton: true,
  lazy: true
});

// Register transient service
container.register('cache', () => new Cache());

// Get instance
const logger = container.get<Logger>('logger');

// Initialize all non-lazy services
await container.initializeAll();
*/
