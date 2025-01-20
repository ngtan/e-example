// src/lib/types/config.ts
export interface ConfigManager {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): void;
}
