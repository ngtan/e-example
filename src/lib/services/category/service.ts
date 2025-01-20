// src/lib/services/category/service.ts

import { BaseBusinessService, RetryOptions } from "../business";
import { CategoryRepository } from "./repository";
import { MonitoringSystem } from "../../monitoring";
import { CacheManager } from "../../cache";
import { Category } from "./types";

function isUUID(idOrSlug: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(idOrSlug);
}

export interface CategoryOperationOptions {
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

export class CategoryService extends BaseBusinessService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    protected monitoring: MonitoringSystem,
    protected cacheManager: CacheManager,
    
    // private readonly slugGenerator: SlugGenerator,
    // private readonly eventBus: EventBus,
    // private readonly logger: Logger,
  ) {
    super(monitoring, cacheManager);
  }

  async getCategory(idOrSlug: string, options?: CategoryOperationOptions): Promise<Result<Category>> {
    return this.createOperation(async () => {
      const category = isUUID(idOrSlug)
        ? await this.categoryRepository.findById(idOrSlug)
        : await this.categoryRepository.findBySlug(idOrSlug);

      if (!category) {
        // throw new CategoryNotFoundError(idOrSlug);
        throw new Error(`Category "${idOrSlug}" not found`);
      }

      return category;
    })
    .withCache(`category:${idOrSlug}`, {
      ttl: 3600000,
      tags: ['category'],
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
    //   NotFoundError: (error) => new CategoryNotFoundError(idOrSlug)
    // })
    .execute();
  }

  // async searchCategories(query: CategoryQuery): Promise<Result<SearchResult<Category>>> {
  //   return this.createOperation(async () => {
  //     return this.categoryRepository.search(query);
  //   })
  //   .execute();
  // }

  // async getCategoryTree(query?: CategoryQuery): Promise<Result<Category[]>> {
  //   return this.createOperation(async () => {
  //     return this.categoryRepository.getTree(query);
  //   })
  //   .execute();
  // }

  // async createCategory(input: CategoryCreateInput): Promise<Result<Category>> {
  //   return this.createOperation(async () => {
  //     // Generate slug if not provided
  //     if (!input.slug) {
  //       input.slug = await this.slugGenerator.generate(input.name);
  //     }

  //     // Validate parent if specified
  //     if (input.parentId) {
  //       const parent = await this.categoryRepository.findById(input.parentId);
  //       if (!parent) {
  //         throw new CategoryNotFoundError(input.parentId);
  //       }
  //     }

  //     const category = await this.categoryRepository.create(input);

  //     await this.eventBus.publish('category.created', {
  //       categoryId: category.id,
  //       name: category.name,
  //       parentId: category.parentId,
  //       timestamp: new Date().toISOString()
  //     });

  //     return category;
  //   })
  //   .withValidation([
  //     new CategoryValidator(input)
  //   ])
  //   .withErrorMapping({
  //     ValidationError: (error) => new CategoryValidationError(error.message),
  //     DuplicateError: (error) => new DuplicateCategoryError(error.field, error.value)
  //   })
  //   .execute();
  // }

  // async updateCategory(id: string, input: CategoryUpdateInput): Promise<Result<Category>> {
  //   return this.createOperation(async () => {
  //     // Generate slug if name is updated and slug is not provided
  //     if (input.name && !input.slug) {
  //       input.slug = await this.slugGenerator.generate(input.name);
  //     }

  //     // Validate parent if specified
  //     if (input.parentId) {
  //       const parent = await this.categoryRepository.findById(input.parentId);
  //       if (!parent) {
  //         throw new CategoryNotFoundError(input.parentId);
  //       }
  //       // Prevent circular reference
  //       if (await this.wouldCreateCircularReference(id, input.parentId)) {
  //         throw new CategoryValidationError('Cannot create circular reference');
  //       }
  //     }

  //     const category = await this.categoryRepository.update(id, input);

  //     await this.eventBus.publish('category.updated', {
  //       categoryId: category.id,
  //       changes: input,
  //       timestamp: new Date().toISOString()
  //     });

  //     return category;
  //   })
  //   .withValidation([
  //     new CategoryValidator(input)
  //   ])
  //   .withErrorMapping({
  //     ValidationError: (error) => new CategoryValidationError(error.message),
  //     DuplicateError: (error) => new DuplicateCategoryError(error.field, error.value),
  //     NotFoundError: (error) => new CategoryNotFoundError(id),
  //     ConflictError: (error) => new OptimisticLockError(id)
  //   })
  //   .execute();
  // }

  // async deleteCategory(id: string): Promise<Result<void>> {
  //   return this.createOperation(async () => {
  //     const category = await this.categoryRepository.findById(id);
  //     if (!category) {
  //       throw new CategoryNotFoundError(id);
  //     }

  //     // Check if category has children
  //     const children = await this.categoryRepository.search({ parentId: id });
  //     if (children.items.length > 0) {
  //       throw new CategoryValidationError('Cannot delete category with children');
  //     }

  //     await this.categoryRepository.delete(id);

  //     await this.eventBus.publish('category.deleted', {
  //       categoryId: id,
  //       timestamp: new Date().toISOString()
  //     });
  //   })
  //   .withErrorMapping({
  //     NotFoundError: (error) => new CategoryNotFoundError(id)
  //   })
  //   .execute();
  // }

  // private async wouldCreateCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
  //   let currentId = newParentId;
  //   const visited = new Set<string>();

  //   while (currentId) {
  //     if (currentId === categoryId) return true;
  //     if (visited.has(currentId)) return true;
      
  //     visited.add(currentId);
  //     const parent = await this.categoryRepository.findById(currentId);
  //     if (!parent) break;
      
  //     currentId = parent.parentId!;
  //   }

  //   return false;
  // }
}

