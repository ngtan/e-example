// src/app/providers.tsx
'use client';

import React from 'react';
import { getContainer } from './container';
// import { Container } from '@/lib/core/di';
// // import { BaseBusinessService } from '@/lib/services/business';
// import { createCache } from '@/lib/cache';
// import { HttpClientImpl } from '@/lib/http';
// import { createMonitoring } from '@/lib/monitoring';

// import { ProductRepository, ProductService } from '@/lib/services/product';

// // export interface ServiceContainer {
// //   httpClient: HttpClient;
// //   cacheManager: CacheManager;
// //   monitor: MonitoringSystem;
// //   productService: BaseBusinessService;
// // }

// // export const container = new Container<ServiceContainer>();
// export const container = Container.getInstance();

// // const monitor = createMonitoring({
// //   environment: 'dev',
// //   version: '123',
// // });

// container.register('monitor', () => {
//   return createMonitoring({
//     environment: 'dev',
//     version: '123',
//   });;
// });

// container.register('cacheManager', () => {
//   return createCache({
//     storage: null,
//     prefix: 'app',
//     monitoring: container.get('monitor'),
//   });
// });


// // const cacheManager = createCache({});

// // container.register('httpClient', () => 
// //   new HttpClientImpl({
// //     get(key: string, defaultValue?: string) { return 'undefined'; },
// //     set(key: string, value: any) {},
// //   }, monitor, cacheManager, undefined, {
// //     baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
// //     defaultTimeout: 5000
// //   })
// // );

// // container.register('cacheManager', () => 
// //   new CacheManager({
// //     ttl: 300,
// //     prefix: 'app:'
// //   })
// // );

// // container.register('monitor', () => 
// //   new Monitor({
// //     serviceName: 'e-commerce',
// //     environment: process.env.NODE_ENV
// //   })
// // );

// container.register('productService', () => {
//   // new BaseBusinessService({
//   //   http: container.resolve('httpClient'),
//   //   cache: container.resolve('cacheManager'),
//   //   monitor: container.resolve('monitor'),
//   //   retryOptions: {
//   //     attempts: 3,
//   //     delay: 1000
//   //   }
//   // })

//   const httpClient = new HttpClientImpl({
//       get(key: string, defaultValue?: string) { return 'undefined'; },
//       set(key: string, value: any) {},
//     }, container.get('monitor'), container.get('cacheManager'), undefined, {
//       baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
//       defaultTimeout: 5000
//     })

//   const productRepository = new ProductRepository(
//     httpClient,
//     container.get('config'),
//     container.get('errorMapper')
//   );

//   return new ProductService(
//     productRepository,
//     container.get('monitoring'),
//     container.get('cacheManager'),
//     // container.get('eventBus'),
//     // container.get('logger'),
//   );
// });

// console.log(123, { container: container.get });

// export const DIContext = React.createContext<Container<ServiceContainer>>(container);
export const DIContext = React.createContext(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
  const [container] = React.useState(() => getContainer());
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
}

// export function useService<K extends keyof ServiceContainer>(
//   token: K
// ): ServiceContainer[K] {
//   const container = React.useContext(DIContext);
//   return container.resolve(token);
// }

export function useService(
  token: string
) {
  const container = React.useContext(DIContext);

  if (!container) {
    throw new Error('DI provider not found');
  }

  return container.get(token);
}
