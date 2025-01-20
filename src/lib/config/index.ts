// src/lib/config/index.ts

// src/lib/config/index.ts
import path from 'path';
import { ConfigOptions, ConfigValue, Config } from './types';
import { SchemaValidator } from './schema';
import { defaultConfig } from './default';

export class Configuration implements Config {
  private config: ConfigValue = {};
  private validator?: SchemaValidator;

  constructor(private options: ConfigOptions = {}) {
    this.options = {
      defaults: defaultConfig,
      environment: process.env.NODE_ENV || 'development',
      configPath: process.env.CONFIG_PATH || path.join(process.cwd(), 'config'),
      ...options,
    };

    if (this.options.schema) {
      this.validator = new SchemaValidator(this.options.schema);
    }
  }

  async load(options?: ConfigOptions): Promise<void> {
    // Merge options
    this.options = { ...this.options, ...options };

    // Load default config
    this.config = { ...this.options.defaults };

    // Load environment-specific config
    if (this.options.environment) {
      try {
        const envConfig = await this.loadEnvironmentConfig();
        this.merge(this.config, envConfig);
      } catch (error) {
        console.warn(`Failed to load environment config: ${error}`);
      }
    }

    // Validate config if schema is provided
    if (this.validator) {
      this.validate();
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key);
    return (value === undefined ? defaultValue : value) as T;
  }

  set(key: string, value: any): void {
    this.setNestedValue(this.config, key, value);
    
    if (this.validator) {
      this.validate();
    }
  }

  has(key: string): boolean {
    return this.getNestedValue(this.config, key) !== undefined;
  }

  delete(key: string): void {
    const parts = key.split('.');
    const last = parts.pop()!;
    const parent = this.getNestedValue(this.config, parts.join('.'));
    
    if (parent && typeof parent === 'object') {
      delete parent[last];
    }
  }

  clear(): void {
    this.config = {};
  }

  validate(): boolean {
    if (!this.validator) {
      return true;
    }
    return this.validator.validate(this.config);
  }

  getAll(): ConfigValue {
    return { ...this.config };
  }

  private async loadEnvironmentConfig(): Promise<ConfigValue> {
    const envPath = path.join(
      this.options.configPath!,
      `${this.options.environment}.json`
    );

    try {
      const module = await import(envPath);
      return module.default || module;
    } catch (error) {
      console.warn(`No config file found for environment: ${this.options.environment}`);
      return {};
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    const parent = parts.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    parent[last] = value;
  }

  private merge(target: any, source: any): void {
    for (const key in source) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

// Export singleton instance
export const config = new Configuration();

// import { MonitoringSystem } from '../monitoring';

// export interface ConfigSource {
//   load(): Promise<Record<string, any>>;
// }

// export class FileConfigSource implements ConfigSource {
//   constructor(private filePath: string) {}

//   async load(): Promise<Record<string, any>> {
//     // Implementation for loading from file
//     return import(this.filePath);
//   }
// }

// export class ApiConfigSource implements ConfigSource {
//   constructor(
//     private apiUrl: string,
//     private fetchOptions?: RequestInit
//   ) {}

//   async load(): Promise<Record<string, any>> {
//     const response = await fetch(this.apiUrl, this.fetchOptions);
//     if (!response.ok) {
//       throw new Error(`Failed to load config: ${response.statusText}`);
//     }
//     return response.json();
//   }
// }

// export class ConfigManager {
//   private config: Record<string, any> = {};
//   private schema: Record<string, any> = {};
//   private watchers = new Set<(config: Record<string, any>) => void>();

//   constructor(
//     private source: ConfigSource,
//     private monitoring: MonitoringSystem,
//     private options: {
//       autoReload?: boolean;
//       reloadInterval?: number;
//     } = {}
//   ) {
//     if (options.autoReload) {
//       this.startAutoReload();
//     }
//   }

//   async load(): Promise<void> {
//     const spanId = this.monitoring.tracer.startSpan('config.load');

//     try {
//       const newConfig = await this.source.load();
//       await this.validate(newConfig);
      
//       const oldConfig = this.config;
//       this.config = newConfig;

//       this.notifyWatchers();
//       this.logConfigChange(oldConfig, newConfig);
//     } catch (error) {
//       this.monitoring.logger.log('error', 'Config load failed', { error });
//       throw error;
//     } finally {
//       this.monitoring.tracer.endSpan(spanId);
//     }
//   }

//   get<T>(path: string, defaultValue?: T): T {
//     return this.getValueByPath(this.config, path) ?? defaultValue;
//   }

//   watch(callback: (config: Record<string, any>) => void): () => void {
//     this.watchers.add(callback);
//     return () => this.watchers.delete(callback);
//   }

//   private async validate(config: Record<string, any>): Promise<void> {
//     // Implementation of config validation
//   }

//   private getValueByPath(obj: any, path: string): any {
//     return path.split('.').reduce((acc, part) => acc?.[part], obj);
//   }

//   private notifyWatchers(): void {
//     this.watchers.forEach(callback => callback(this.config));
//   }

//   private logConfigChange(oldConfig: Record<string, any>, newConfig: Record<string, any>): void {
//     const changes = this.diffConfigs(oldConfig, newConfig);
//     if (Object.keys(changes).length > 0) {
//       this.monitoring.logger.log('info', 'Config changed', { changes });
//     }
//   }

//   private diffConfigs(oldConfig: Record<string, any>, newConfig: Record<string, any>): Record<string, any> {
//     // Implementation of config diffing
//     return {};
//   }

//   private startAutoReload(): void {
//     setInterval(
//       () => this.load(),
//       this.options.reloadInterval || 5 * 60 * 1000
//     );
//   }
// }
