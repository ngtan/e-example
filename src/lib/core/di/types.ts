// src/lib/core/di/types.ts
export type ServiceFactory<T> = () => T;

export interface ServiceDefinition<T> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  lazy: boolean;
  dependencies?: string[];
}

export interface ContainerOptions {
  strict?: boolean;  // Throw error on circular dependencies
  autoCreate?: boolean;  // Auto-create instances for dependencies
  maxDepth?: number;  // Maximum dependency depth
}
