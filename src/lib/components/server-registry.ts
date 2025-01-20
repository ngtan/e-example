// src/lib/components/server-registry.ts
import { ComponentConfig, ServerComponentRegistry } from './types';
import { ServerComponentLoader } from './server-loader';

export class Registry implements ServerComponentRegistry {
  private components: Map<string, any> = new Map();
  private loader: ServerComponentLoader;

  constructor(basePath?: string) {
    this.loader = new ServerComponentLoader(basePath);
  }

  register(name: string, component: any) {
    this.components.set(name, component);
  }

  async get(name: string) {
    return this.components.get(name);
  }

  async preload(configs: ComponentConfig[]) {
    await Promise.all(
      configs.map(config => this.loader.load(config))
    );
  }
}

// Create a singleton instance
export const serverRegistry = new Registry();
