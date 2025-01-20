// src/lib/components/server-loader.ts
import path from 'path';
import { ComponentConfig, ComponentLoader } from './types';

export class ServerComponentLoader implements ComponentLoader {
  private readonly componentMap = new Map<string, any>();
  private readonly basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'src/components')) {
    this.basePath = basePath;
  }

  async load(config: ComponentConfig) {
    try {
      // Check cache first
      if (this.componentMap.has(config.name)) {
        return this.componentMap.get(config.name);
      }

      let component;

      if (config.importPath) {
        // Load local component
        component = await this.loadLocalComponent(config.importPath);
      } else if (config.url) {
        // Load remote component
        component = await this.loadRemoteComponent(config.url);
      } else {
        throw new Error('Either importPath or url must be provided');
      }

      // Cache the component
      this.componentMap.set(config.name, component);
      return component;
    } catch (error) {
      console.error(`Failed to load component ${config.name}:`, error);
      throw error;
    }
  }

  private async loadLocalComponent(importPath: string) {
    try {
      // Resolve the full path
      const fullPath = path.isAbsolute(importPath)
        ? importPath
        : path.join(this.basePath, importPath);

      // Dynamic import using require
      const loadedModule = await import(fullPath);
      return loadedModule.default || loadedModule;
    } catch (error) {
      console.error('Error loading local component:', error);
      throw error;
    }
  }

  private async loadRemoteComponent(url: string) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const loadedModule = await response.json();
      return loadedModule.default || loadedModule;
    } catch (error) {
      console.error('Error loading remote component:', error);
      throw error;
    }
  }
}
