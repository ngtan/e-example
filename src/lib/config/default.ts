// src/lib/config/default.ts
// src/lib/config/default.ts
import { ConfigValue } from './types';

export const defaultConfig: ConfigValue = {
  app: {
    name: 'e-example',
    version: '1.0.0',
    environment: 'development',
  },
  server: {
    host: 'localhost',
    port: 3000,
    cors: {
      enabled: true,
      origins: ['http://localhost:3000'],
    },
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'e-example',
    user: 'postgres',
    password: '',
    pool: {
      min: 2,
      max: 10,
    },
  },
  cache: {
    enabled: true,
    ttl: 3600,
    driver: 'memory',
  },
  logging: {
    level: 'info',
    format: 'json',
    enabled: true,
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1d',
    },
    bcrypt: {
      saltRounds: 10,
    },
  }
};

// export const defaultConfig: AppConfig = {
//   api: {
//     baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
//     timeout: 5000,
//   },
//   features: {
//     enableCart: true,
//     enableWishlist: true,
//   },
//   pages: {
//     product: {
//       layout: {
//         maxWidth: '7xl',
//         padding: '8',
//       },
//       components: [
//         {
//           id: 'product-gallery',
//           type: 'ProductGallery',
//           props: {
//             aspectRatio: 1,
//           },
//         },
//         {
//           id: 'product-info',
//           type: 'ProductInfo',
//           props: {
//             showPrice: true,
//             showStock: true,
//           },
//         },
//         // ... more component configs
//       ],
//     },
//     // ... more page configs
//   },
// };
