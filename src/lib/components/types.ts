// src/lib/components/types.ts
export interface ComponentConfig {
  name: string;
  url?: string;
  importPath?: string;
  props?: Record<string, any>;
}

export interface ComponentLoader {
  load: (config: ComponentConfig) => Promise<any>;
}

export interface ComponentRegistry {
  register: (name: string, component: any) => void;
  get: (name: string) => any | undefined;
}
