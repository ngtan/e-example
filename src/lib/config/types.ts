// src/lib/config/types.ts
export type Primitive = string | number | boolean | null | undefined;

export interface ConfigValue {
  [key: string]: Primitive | ConfigValue | Array<Primitive | ConfigValue>;
}

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validate?: (value: any) => boolean;
    items?: ConfigSchema; // For array type
    properties?: ConfigSchema; // For object type
  };
}

export interface ConfigOptions {
  schema?: ConfigSchema;
  defaults?: ConfigValue;
  environment?: string;
  configPath?: string;
}

export interface Config {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  load(options?: ConfigOptions): Promise<void>;
  validate(): boolean;
  getAll(): ConfigValue;
}

///////////

// export interface AppConfig {
//   api: {
//     baseUrl: string;
//     timeout: number;
//   };
//   features: {
//     enableCart: boolean;
//     enableWishlist: boolean;
//   };
//   pages: {
//     product: ProductPageConfig;
//     cart: CartPageConfig;
//   };
// }

// export interface ProductPageConfig {
//   layout: {
//     maxWidth: string;
//     padding: string;
//   };
//   components: ComponentConfig[];
// }

// export interface ComponentConfig {
//   id: string;
//   type: string;
//   props: Record<string, any>;
// }
