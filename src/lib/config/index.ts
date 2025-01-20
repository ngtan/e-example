// src/lib/config/index.ts
import { MonitoringSystem } from '../monitoring';

export interface ConfigSource {
  load(): Promise<Record<string, any>>;
}

export class FileConfigSource implements ConfigSource {
  constructor(private filePath: string) {}

  async load(): Promise<Record<string, any>> {
    // Implementation for loading from file
    return import(this.filePath);
  }
}

export class ApiConfigSource implements ConfigSource {
  constructor(
    private apiUrl: string,
    private fetchOptions?: RequestInit
  ) {}

  async load(): Promise<Record<string, any>> {
    const response = await fetch(this.apiUrl, this.fetchOptions);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    return response.json();
  }
}

export class ConfigManager {
  private config: Record<string, any> = {};
  private schema: Record<string, any> = {};
  private watchers = new Set<(config: Record<string, any>) => void>();

  constructor(
    private source: ConfigSource,
    private monitoring: MonitoringSystem,
    private options: {
      autoReload?: boolean;
      reloadInterval?: number;
    } = {}
  ) {
    if (options.autoReload) {
      this.startAutoReload();
    }
  }

  async load(): Promise<void> {
    const spanId = this.monitoring.tracer.startSpan('config.load');

    try {
      const newConfig = await this.source.load();
      await this.validate(newConfig);
      
      const oldConfig = this.config;
      this.config = newConfig;

      this.notifyWatchers();
      this.logConfigChange(oldConfig, newConfig);
    } catch (error) {
      this.monitoring.logger.log('error', 'Config load failed', { error });
      throw error;
    } finally {
      this.monitoring.tracer.endSpan(spanId);
    }
  }

  get<T>(path: string, defaultValue?: T): T {
    return this.getValueByPath(this.config, path) ?? defaultValue;
  }

  watch(callback: (config: Record<string, any>) => void): () => void {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  private async validate(config: Record<string, any>): Promise<void> {
    // Implementation of config validation
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private notifyWatchers(): void {
    this.watchers.forEach(callback => callback(this.config));
  }

  private logConfigChange(oldConfig: Record<string, any>, newConfig: Record<string, any>): void {
    const changes = this.diffConfigs(oldConfig, newConfig);
    if (Object.keys(changes).length > 0) {
      this.monitoring.logger.log('info', 'Config changed', { changes });
    }
  }

  private diffConfigs(oldConfig: Record<string, any>, newConfig: Record<string, any>): Record<string, any> {
    // Implementation of config diffing
    return {};
  }

  private startAutoReload(): void {
    setInterval(
      () => this.load(),
      this.options.reloadInterval || 5 * 60 * 1000
    );
  }
}
