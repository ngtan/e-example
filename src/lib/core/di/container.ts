// src/lib/core/di/container.ts
import { DIError, ServiceNotFoundError, CircularDependencyError } from './errors';
import type { ServiceFactory, ServiceDefinition, ContainerOptions } from './types';

export class Container {
  private static instance: Container;
  private services = new Map<string, ServiceDefinition<any>>();
  private singletons = new Map<string, any>();
  private resolving = new Set<string>();

  constructor(private options: ContainerOptions = {}) {
    this.options = {
      strict: true,
      autoCreate: false,
      maxDepth: 10,
      ...options
    };
  }

  static getInstance(options?: ContainerOptions): Container {
    if (!Container.instance) {
      Container.instance = new Container(options);
    }
    return Container.instance;
  }

  register<T>(
    token: string,
    factory: ServiceFactory<T>,
    options: {
      singleton?: boolean;
      lazy?: boolean;
      dependencies?: string[];
    } = {}
  ): void {
    const definition: ServiceDefinition<T> = {
      factory,
      singleton: options.singleton ?? false,
      lazy: options.lazy ?? false,
      dependencies: options.dependencies
    };

    this.services.set(token, definition);
  }

  get<T>(token: string): T {
    return this.resolve<T>(token, new Set());
  }

  private resolve<T>(token: string, parents: Set<string>): T {
    // Check circular dependencies
    if (this.resolving.has(token)) {
      if (this.options.strict) {
        throw new CircularDependencyError([...parents, token]);
      }
      // In non-strict mode, return cached instance or create new one
      const cached = this.resolveSingleton<T>(token);
      return cached !== null ? cached : this.createInstance<T>(token);
    }

    // Check dependency depth
    if (parents.size >= this.options.maxDepth!) {
      throw new DIError(
        `Maximum dependency depth of ${this.options.maxDepth} exceeded`,
        { token, depth: parents.size }
      );
    }

    const definition = this.services.get(token);
    if (!definition) {
      if (!this.options.autoCreate) {
        throw new ServiceNotFoundError(token);
      }
      // Auto-create basic instances in non-strict mode
      return {} as T;
    }

    // Handle singleton
    if (definition.singleton) {
      const cached = this.resolveSingleton<T>(token);
      if (cached !== null) {
        return cached;
      }
    }

    return this.createInstance<T>(token);
  }

  private resolveSingleton<T>(token: string): T | null {
    const instance = this.singletons.get(token);
    return instance !== undefined ? (instance as T) : null;
  }

  private createInstance<T>(token: string): T {
    const definition = this.services.get(token);
    if (!definition) {
      throw new ServiceNotFoundError(token);
    }

    try {
      this.resolving.add(token);
      const instance = definition.factory();

      if (definition.singleton) {
        this.singletons.set(token, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  has(token: string): boolean {
    return this.services.has(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.resolving.clear();
  }

  // Utility methods
  async initializeAll(): Promise<void> {
    const promises = Array.from(this.services.entries())
      .filter(([_, def]) => !def.lazy)
      .map(async ([token]) => {
        await this.get(token);
      });

    await Promise.all(promises);
  }

  getRegisteredTokens(): string[] {
    return Array.from(this.services.keys());
  }
}
