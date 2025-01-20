// src/lib/components/server-renderer.tsx
import { ComponentConfig } from './types';
import { ServerComponentLoader } from './server-loader';

interface ServerComponentProps {
  config: ComponentConfig;
  loader?: ServerComponentLoader;
}

export async function ServerComponent({ 
  config, 
  loader = new ServerComponentLoader()
}: ServerComponentProps) {
  try {
    const Component = await loader.load(config);
    
    if (!Component) {
      throw new Error(`Component ${config.name} not found`);
    }

    return <Component {...config.props} />;
  } catch (error) {
    // You might want to handle errors differently in production
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading component: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
