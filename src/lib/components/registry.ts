// src/lib/components/registry.ts
import { ComponentRegistry } from './types';

class Registry implements ComponentRegistry {
  private components: Map<string, any> = new Map();

  register(name: string, component: any) {
    this.components.set(name, component);
  }

  get(name: string) {
    return this.components.get(name);
  }
}

export const registry = new Registry();
