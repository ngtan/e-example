// src/lib/services/category/types.ts
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
  level: number;
  path: string[];
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
}

export interface CategoryCreateInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
  version: string; // For optimistic locking
}

export interface CategoryQuery extends BaseQuery {
  parentId?: string;
  includeInactive?: boolean;
  includeChildren?: boolean;
  level?: number;
}

// // src/lib/services/category/service.ts
// export class CategoryService extends BaseService {
//   async getCategories(params?: QueryParams): Promise<Result<Category[]>> {
//     return this.cacheWrapper(
//       `categories:${JSON.stringify(params)}`,
//       async () => {
//         const response = await this.http.get<ApiResponse<Category[]>>('/categories', {
//           params,
//         });
//         return response.data;
//       },
//       30 * 60 * 1000 // 30 minutes cache
//     );
//   }

//   async getCategory(slug: string): Promise<Result<Category>> {
//     return this.cacheWrapper(
//       `category:${slug}`,
//       async () => {
//         const response = await this.http.get<ApiResponse<Category>>(
//           `/categories/${slug}`
//         );
//         return response.data;
//       }
//     );
//   }

//   async getCategoryTree(): Promise<Result<Category[]>> {
//     return this.cacheWrapper(
//       'categoryTree',
//       async () => {
//         const response = await this.http.get<ApiResponse<Category[]>>(
//           '/categories/tree'
//         );
//         return response.data;
//       },
//       60 * 60 * 1000 // 1 hour cache
//     );
//   }

//   async getCategoryProducts(
//     categorySlug: string,
//     params: QueryParams
//   ): Promise<PaginatedResult<Product>> {
//     const cacheKey = `category:${categorySlug}:products:${JSON.stringify(params)}`;

//     return this.cacheWrapper(
//       cacheKey,
//       async () => {
//         const response = await this.http.get<ApiResponse<Product[]>>(
//           `/categories/${categorySlug}/products`,
//           { params }
//         );

//         return {
//           data: response.data,
//           pagination: response.meta.pagination,
//         };
//       },
//       5 * 60 * 1000 // 5 minutes cache
//     );
//   }
// }
