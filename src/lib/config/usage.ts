// Example usage
import { config } from '@/lib/config';
import { ConfigSchema } from '@/lib/config/types';

// Define schema
const schema: ConfigSchema = {
  app: {
    type: 'object',
    required: true,
    properties: {
      name: {
        type: 'string',
        required: true,
      },
      version: {
        type: 'string',
        required: true,
      },
      environment: {
        type: 'string',
        required: true,
        validate: (value) => ['development', 'staging', 'production'].includes(value),
      },
    },
  },
  database: {
    type: 'object',
    required: true,
    properties: {
      host: {
        type: 'string',
        required: true,
      },
      port: {
        type: 'number',
        required: true,
        validate: (value) => value > 0 && value < 65536,
      },
    },
  },
};

// Initialize config
async function initConfig() {
  await config.load({
    schema,
    environment: process.env.NODE_ENV,
  });

  // Access config values
  const dbHost = config.get<string>('database.host');
  const dbPort = config.get<number>('database.port');
  
  // Set new values
  config.set('app.version', '1.0.1');
  
  // Check if key exists
  if (config.has('cache.enabled')) {
    // Do something
  }
  
  // Get all config
  const fullConfig = config.getAll();
  console.log('Full config:', fullConfig);
}

initConfig().catch(console.error);
