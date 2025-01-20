// src/lib/services/category/types.ts
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
  level: number; // TODO:
  path: string[];
  isActive: boolean;
  sortOrder: number; // TODO
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

export interface BaseQuery {
  defined_key: string; // TODO
}

export interface CategoryQuery extends BaseQuery {
  parentId?: string;
  includeInactive?: boolean;
  includeChildren?: boolean;
  level?: number;
}
