// src/lib/services/index.ts
export interface Services {
  auth: AuthService;
  user: UserService;
  product: ProductService;
}

export function createServices(
  http: HttpClient,
  cache: Cache,
  monitoring: MonitoringSystem
): Services {
  return {
    auth: new AuthService(http, cache, monitoring),
    user: new UserService(http, cache, monitoring),
    product: new ProductService(http, cache, monitoring)
  };
}
