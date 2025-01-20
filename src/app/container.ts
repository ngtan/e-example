import { Container } from '@/lib/core/di';
import { createCache } from '@/lib/cache';
import { HttpClientImpl } from '@/lib/http';
import { createMonitoring } from '@/lib/monitoring';

import { ProductRepository, ProductService } from '@/lib/services/product';

let container: Container;

function createContainer() {
  const newContainer = new Container();

  newContainer.register('monitor', () => {
    return createMonitoring({
      environment: process.env.NODE_ENV,
      version: '123',
    });;
  });

  newContainer.register('cacheManager', () => {
    return createCache({
      storage: typeof window === 'undefined'
        ? null // Server-side in-memory cache
        : localStorage, // Client-side persistent cache,
      prefix: 'app:',
      monitoring: newContainer.get('monitor'),
    });
  });

  newContainer.register('productService', () => {
    const httpClient = new HttpClientImpl({
        get(key: string, defaultValue?: string) { return 'undefined'; },
        set(key: string, value: any) {},
      }, newContainer.get('monitor'), newContainer.get('cacheManager'), undefined, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
        defaultTimeout: 5000
      })

    const productRepository = new ProductRepository(
      httpClient,
      undefined,
      undefined,
      // newContainer.get('config'),
      // newContainer.get('errorMapper')
    );

    return new ProductService(
      productRepository,
      newContainer.get('monitor'),
      newContainer.get('cacheManager'),
      // newContainer.get('eventBus'),
      // newContainer.get('logger'),
    );
  }, { singleton: true });

  return newContainer;
}

export function getContainer() {
  if (!container) {
    container = createContainer();
  }

  return container;
}

