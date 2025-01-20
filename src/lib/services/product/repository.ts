// src/lib/services/product/repository.ts
// 3. Infrastructure Layer (Adapters)
export class HttpProductRepository implements ProductRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: Config,
    private readonly errorMapper: ErrorMapper
  ) {}

  async findById(id: string): Promise<Product | null> {
    try {
      const response = await this.httpClient.get<ApiResponse<Product>>(
        `${this.config.apiUrls.products}/${id}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpNotFoundError) {
        return null;
      }
      throw this.errorMapper.mapRepositoryError(error);
    }
  }

  async search(query: NormalizedProductQuery): Promise<SearchResult<Product>> {
    try {
      const response = await this.httpClient.get<ApiResponse<Product[]>>(
        this.config.apiUrls.products,
        {
          params: this.buildSearchParams(query),
          headers: this.buildHeaders(query)
        }
      );

      return {
        items: response.data,
        total: parseInt(response.headers['x-total-count'], 10)
      };
    } catch (error) {
      throw this.errorMapper.mapRepositoryError(error);
    }
  }

  async create(input: ProductCreateInput): Promise<Product> {
    try {
      const response = await this.httpClient.post<ApiResponse<Product>>(
        this.config.apiUrls.products,
        input
      );
      return response.data;
    } catch (error) {
      throw this.errorMapper.mapRepositoryError(error);
    }
  }

  async update(id: string, input: Partial<ProductUpdateInput>): Promise<Product> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Product>>(
        `${this.config.apiUrls.products}/${id}`,
        input,
        {
          headers: {
            'If-Match': input.version // For optimistic locking
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpConflictError) {
        throw new OptimisticLockError(id);
      }
      throw this.errorMapper.mapRepositoryError(error);
    }
  }

  private buildSearchParams(query: NormalizedProductQuery): Record<string, any> {
    return {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      filter: JSON.stringify(query.filters),
      include: query.include?.join(','),
      // ... other query parameters
    };
  }

  private buildHeaders(query: NormalizedProductQuery): Record<string, string> {
    return {
      'Accept-Language': query.locale || 'en',
      'X-Custom-Header': query.customData?.header,
      // ... other headers
    };
  }
}

// Usage in dependency injection container
// 4. Infrastructure Configuration
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
