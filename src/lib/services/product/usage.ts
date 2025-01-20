// Usage in dependency injection container
export function createProductService(container: Container): ProductService {
  const httpClient = new HttpClient(
    container.get('axios'),
    container.get('retryStrategy'),
    container.get('monitoring')
  );

  const productRepository = new HttpProductRepository(
    httpClient,
    container.get('config'),
    container.get('errorMapper')
  );

  return new ProductService(
    productRepository,
    container.get('cacheManager'),
    container.get('eventBus'),
    container.get('logger')
  );
}
