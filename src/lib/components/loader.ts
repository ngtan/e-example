// src/lib/components/loader.ts
import { ComponentConfig, ComponentLoader } from './types';
import { registry } from './registry';

export class DynamicComponentLoader implements ComponentLoader {
  async load(config: ComponentConfig) {
    // Check if component is already registered
    const existing = registry.get(config.name);
    if (existing) {
      return existing;
    }

    try {
      let component;

      if (config.url) {
        // Remote component loading
        component = await this.loadRemoteComponent(config.url);
      } else if (config.importPath) {
        // Local component loading
        component = await this.loadLocalComponent(config.importPath);
      } else {
        throw new Error('Either url or importPath must be provided');
      }

      registry.register(config.name, component);
      return component;
    } catch (error) {
      console.error(`Failed to load component ${config.name}:`, error);
      throw error;
    }
  }

  private async loadRemoteComponent(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      // Create a blob URL for the component code
      const blob = new Blob([text], { type: 'text/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Import the component using dynamic import
      const loadedModule = await import(/* @vite-ignore */ blobUrl);
      URL.revokeObjectURL(blobUrl);
      
      return loadedModule.default || loadedModule;
    } catch (error) {
      console.error('Error loading remote component:', error);
      throw error;
    }
  }

  private async loadLocalComponent(importPath: string) {
    try {
      const loadedModule = await import(/* @vite-ignore */ importPath);
      return loadedModule.default || loadedModule;
    } catch (error) {
      console.error('Error loading local component:', error);
      throw error;
    }
  }
}


// export class ComponentLoader {
//   private loadingComponents = new Map<string, Promise<any>>();
//   private loadedComponents = new Map<string, any>();
//   private errorComponents = new Map<string, Error>();

//   constructor(
//     private monitoring: MonitoringSystem,
//     private options: ComponentLoaderOptions
//   ) {}

//   async load(name: string): Promise<any> {
//     // Return cached component if available
//     if (this.loadedComponents.has(name)) {
//       return this.loadedComponents.get(name);
//     }

//     // Return existing loading promise if component is being loaded
//     if (this.loadingComponents.has(name)) {
//       return this.loadingComponents.get(name);
//     }

//     // Start loading component
//     const loadingPromise = this.loadComponent(name);
//     this.loadingComponents.set(name, loadingPromise);

//     try {
//       const component = await loadingPromise;
//       this.loadedComponents.set(name, component);
//       this.loadingComponents.delete(name);
//       return component;
//     } catch (error) {
//       this.errorComponents.set(name, error as Error);
//       this.loadingComponents.delete(name);
//       throw error;
//     }
//   }

//   private async loadComponent(name: string): Promise<any> {
//     const spanId = this.monitoring.tracer.startSpan('component.load', { name });

//     try {
//       const component = await this.options.loader(name);
//       return this.validateComponent(component);
//     } catch (error) {
//       this.monitoring.logger.log('error', 'Component load failed', {
//         name,
//         error
//       });
//       throw error;
//     } finally {
//       this.monitoring.tracer.endSpan(spanId);
//     }
//   }
// }

// // src/lib/components/renderer.tsx
// export class OptimizedComponentRenderer {
//   private suspenseCache = new Map<string, Promise<any>>();

//   constructor(
//     private loader: ComponentLoader,
//     private monitoring: MonitoringSystem
//   ) {}

//   render(config: ComponentConfig): React.ReactElement {
//     const Component = React.lazy(() => this.loadComponent(config.name));

//     return (
//       <ErrorBoundary
//         fallback={this.renderError}
//         onError={this.handleError}
//       >
//         <React.Suspense fallback={this.renderLoading(config)}>
//           <Component {...config.props} />
//         </React.Suspense>
//       </ErrorBoundary>
//     );
//   }

//   private async loadComponent(name: string) {
//     if (!this.suspenseCache.has(name)) {
//       this.suspenseCache.set(
//         name,
//         this.loader.load(name).catch((error) => {
//           this.suspenseCache.delete(name);
//           throw error;
//         })
//       );
//     }
//     return this.suspenseCache.get(name);
//   }

//   private renderLoading(config: ComponentConfig): React.ReactElement {
//     return config.loading || <DefaultLoadingComponent />;
//   }

//   private renderError(error: Error): React.ReactElement {
//     return <DefaultErrorComponent error={error} />;
//   }

//   private handleError = (error: Error): void => {
//     this.monitoring.logger.log('error', 'Component render error', { error });
//   };
// }
