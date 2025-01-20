// src/lib/components/renderer.tsx
export class OptimizedComponentRenderer {
  private suspenseCache = new Map<string, Promise<any>>();

  constructor(
    private loader: ComponentLoader,
    private monitoring: MonitoringSystem
  ) {}

  render(config: ComponentConfig): React.ReactElement {
    const Component = React.lazy(() => this.loadComponent(config.name));

    return (
      <ErrorBoundary
        fallback={this.renderError}
        onError={this.handleError}
      >
        <React.Suspense fallback={this.renderLoading(config)}>
          <Component {...config.props} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  private async loadComponent(name: string) {
    if (!this.suspenseCache.has(name)) {
      this.suspenseCache.set(
        name,
        this.loader.load(name).catch((error) => {
          this.suspenseCache.delete(name);
          throw error;
        })
      );
    }
    return this.suspenseCache.get(name);
  }

  private renderLoading(config: ComponentConfig): React.ReactElement {
    return config.loading || <DefaultLoadingComponent />;
  }

  private renderError(error: Error): React.ReactElement {
    return <DefaultErrorComponent error={error} />;
  }

  private handleError = (error: Error): void => {
    this.monitoring.logger.log('error', 'Component render error', { error });
  };
}
