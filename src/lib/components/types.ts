// src/lib/components/types.ts
export interface ComponentConfig {
  name: string;
  url?: string;
  importPath?: string;
  props?: Record<string, any>;
  // Add server-specific options
  serverCache?: {
    revalidate?: number;
    tags?: string[];
  };
}

export interface ComponentLoader {
  load: (config: ComponentConfig) => Promise<any>;
}

export interface ComponentRegistry {
  register: (name: string, component: any) => void;
  get: (name: string) => any | undefined;
}

export interface ServerComponentRegistry {
  register: (name: string, component: any) => void;
  get: (name: string) => Promise<any>;
  preload: (configs: ComponentConfig[]) => Promise<void>;
}
