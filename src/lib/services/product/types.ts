// src/lib/services/product/types.ts

// 1. Core Domain Layer
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  variants?: ProductVariant[];
  specs?: Record<string, any>;
  stock: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  filter?: Record<string, any>;
}


export interface BaseQuery {
  defined_key: string; // TODO
}

export interface ProductQuery extends BaseQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

// src/lib/services/product/types.ts
// export interface ProductOperationOptions {
//   skipCache?: boolean;
//   invalidateCache?: boolean;
//   retryOptions?: {
//     maxAttempts: number;
//     delay: number;
//     shouldRetry?: (error: Error) => boolean;
//   };
//   validateOptions?: {
//     skipValidation?: boolean;
//     customValidators?: Validator[];
//   };
// }
