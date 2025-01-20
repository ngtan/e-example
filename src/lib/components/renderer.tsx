// src/lib/components/renderer.tsx
import React, { Suspense } from 'react';
import { ComponentConfig } from './types';
import { DynamicComponentLoader } from './loader';

interface DynamicComponentProps {
  config: ComponentConfig;
  fallback?: React.ReactNode;
}

const loader = new DynamicComponentLoader();

export function DynamicComponent({ config, fallback = null }: DynamicComponentProps) {
  const [Component, setComponent] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        const component = await loader.load(config);
        if (mounted) {
          setComponent(() => component);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load component'));
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [config]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading component: {error.message}
      </div>
    );
  }

  if (!Component) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...config.props} />
    </Suspense>
  );
}

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
