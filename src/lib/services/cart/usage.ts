// Usage
export function createCartService(container: Container): CartService {
  return new CartService(
    new CartRepository(
      container.get('httpClient'),
      container.get('cache'),
      container.get('config')
    ),
    container.get('productService'),
    container.get('eventBus'),
    container.get('logger')
  );
}
