// src/lib/services/product/service.ts
// 2. Application Layer (Use Cases)
import { BaseBusinessService, RetryOptions } from '../business';
import { ProductRepository } from './repository';
import { MonitoringSystem } from '../../monitoring';
import { CacheManager } from '../../cache';
import { Product } from './types';

export interface ProductOperationOptions {
  skipCache?: boolean;
  invalidateCache?: boolean;
  retryOptions?: RetryOptions;
  // validateOptions?: {
  //   skipValidation?: boolean;
  //   customValidators?: ValidationRule[];
  // };
}

export interface Result<T> {
  data: T;
  errors?: Error[];
}


export class ProductService extends BaseBusinessService {
  constructor(
    private readonly productRepository: ProductRepository,
    protected monitoring: MonitoringSystem,
    protected cacheManager: CacheManager,
    // private readonly eventBus: EventBus,
    // private readonly logger: Logger
  ) {
    super(monitoring, cacheManager);
  }

  async getProduct(
    id: string, 
    options?: ProductOperationOptions
  ): Promise<Result<Product>> {
    return this.createOperation(async () => {
      const product = await this.productRepository.findById(id);
      
      if (!product) {
        // throw new NotFoundError(`Product ${id} not found`);
        throw new Error(`Product ${id} not found`);
      }

      // await this.eventBus.publish('product.viewed', { productId: id });
      
      return product;
    })
    .withCache(`product:${id}`, {
      ttl: 3600000,
      tags: ['product'],
      skip: options?.skipCache
    })
    .withRetry({
      maxAttempts: options?.retryOptions?.maxAttempts ?? 3,
      getDelayMs: attempt => Math.pow(2, attempt) * 1000,
      // delay: options?.retryOptions?.delay ?? 1000,
      shouldRetry: options?.retryOptions?.shouldRetry ?? 
        // ((error) => error instanceof NetworkError)
        ((error) => error instanceof Error)
    })
    // .withErrorMapping({
    //   NotFoundError: (error) => new ApplicationError('Product not found', error),
    //   NetworkError: (error) => new ApplicationError('Service unavailable', error)
    // })
    .execute();
  }

  // async searchProducts(
  //   query: ProductQuery,
  //   options?: ProductOperationOptions
  // ): Promise<PaginatedResult<Product>> {
  //   return this.createOperation(async () => {
  //     // Pre-processing query parameters
  //     const normalizedQuery = this.normalizeSearchQuery(query);
      
  //     // Core business logic
  //     const { items, total } = await this.productRepository.search(normalizedQuery);
      
  //     // Post-processing results
  //     const enrichedItems = await this.enrichProductData(items);
      
  //     // Analytics
  //     await this.trackSearchQuery(normalizedQuery);

  //     return {
  //       data: enrichedItems,
  //       pageInfo: this.calculatePagination(normalizedQuery, total)
  //     };
  //   })
  //   .withCache(`products:${this.generateCacheKey(query)}`, {
  //     ttl: 300000,
  //     tags: ['products'],
  //     skip: options?.skipCache
  //   })
  //   .withRetry(options?.retryOptions)
  //   .withValidation(options?.validateOptions?.customValidators ?? [
  //     new SearchQueryValidator(query)
  //   ])
  //   .execute();
  // }

  // async createProduct(
  //   input: ProductCreateInput,
  //   options?: ProductOperationOptions
  // ): Promise<Result<Product>> {
  //   return this.createOperation(async () => {
  //     // Pre-validation processing
  //     const normalizedInput = this.normalizeProductInput(input);
      
  //     // Core business logic
  //     const product = await this.productRepository.create(normalizedInput);
      
  //     // Post-creation processing
  //     await Promise.all([
  //       this.eventBus.publish('product.created', { product }),
  //       this.indexProduct(product),
  //       options?.invalidateCache && 
  //         this.cacheManager.invalidateByTags(['products'])
  //     ]);

  //     return product;
  //   })
  //   .withValidation(options?.validateOptions?.customValidators ?? [
  //     new ProductNameValidator(input.name),
  //     new ProductPriceValidator(input.price),
  //     new ProductCategoryValidator(input.categoryId)
  //   ])
  //   .withTransaction()
  //   .withErrorMapping({
  //     ValidationError: (error) => new ApplicationError('Invalid product data', error),
  //     DatabaseError: (error) => new ApplicationError('Failed to create product', error)
  //   })
  //   .execute();
  // }

  // async updateProduct(
  //   id: string,
  //   input: Partial<ProductUpdateInput>,
  //   options?: ProductOperationOptions
  // ): Promise<Result<Product>> {
  //   return this.createOperation(async () => {
  //     const existingProduct = await this.productRepository.findById(id);
  //     if (!existingProduct) {
  //       throw new NotFoundError(`Product ${id} not found`);
  //     }

  //     const normalizedInput = this.normalizeUpdateInput(input);
  //     const updatedProduct = await this.productRepository.update(id, normalizedInput);

  //     await Promise.all([
  //       this.eventBus.publish('product.updated', { 
  //         product: updatedProduct,
  //         changes: this.detectChanges(existingProduct, updatedProduct)
  //       }),
  //       this.reindexProduct(updatedProduct),
  //       options?.invalidateCache && 
  //         this.cacheManager.invalidateByTags(['products', `product:${id}`])
  //     ]);

  //     return updatedProduct;
  //   })
  //   .withValidation(options?.validateOptions?.customValidators ?? [
  //     new ProductUpdateValidator(input)
  //   ])
  //   .withTransaction()
  //   .withOptimisticLocking()
  //   .execute();
  // }

  // // Helper methods
  // private normalizeSearchQuery(query: ProductQuery): NormalizedProductQuery {
  //   // Normalize and sanitize search parameters
  // }

  // private async enrichProductData(products: Product[]): Promise<Product[]> {
  //   // Add additional data like inventory levels, ratings, etc.
  // }

  // private async trackSearchQuery(query: NormalizedProductQuery): Promise<void> {
  //   // Track search analytics
  // }

  // private calculatePagination(
  //   query: NormalizedProductQuery,
  //   total: number
  // ): PaginationInfo {
  //   // Calculate pagination metadata
  // }

  // private generateCacheKey(query: ProductQuery): string {
  //   // Generate deterministic cache key from query parameters
  // }

  // private detectChanges(
  //   oldProduct: Product,
  //   newProduct: Product
  // ): Record<string, any> {
  //   // Detect which fields changed
  // }
}
