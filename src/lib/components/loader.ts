// src/lib/components/loader.ts
export class ComponentLoader {
  private loadingComponents = new Map<string, Promise<any>>();
  private loadedComponents = new Map<string, any>();
  private errorComponents = new Map<string, Error>();

  constructor(
    private monitoring: MonitoringSystem,
    private options: ComponentLoaderOptions
  ) {}

  async load(name: string): Promise<any> {
    // Return cached component if available
    if (this.loadedComponents.has(name)) {
      return this.loadedComponents.get(name);
    }

    // Return existing loading promise if component is being loaded
    if (this.loadingComponents.has(name)) {
      return this.loadingComponents.get(name);
    }

    // Start loading component
    const loadingPromise = this.loadComponent(name);
    this.loadingComponents.set(name, loadingPromise);

    try {
      const component = await loadingPromise;
      this.loadedComponents.set(name, component);
      this.loadingComponents.delete(name);
      return component;
    } catch (error) {
      this.errorComponents.set(name, error as Error);
      this.loadingComponents.delete(name);
      throw error;
    }
  }

  private async loadComponent(name: string): Promise<any> {
    const spanId = this.monitoring.tracer.startSpan('component.load', { name });

    try {
      const component = await this.options.loader(name);
      return this.validateComponent(component);
    } catch (error) {
      this.monitoring.logger.log('error', 'Component load failed', {
        name,
        error
      });
      throw error;
    } finally {
      this.monitoring.tracer.endSpan(spanId);
    }
  }
}

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
