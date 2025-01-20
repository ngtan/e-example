// src/lib/services/category/errors.ts
// export class CategoryError extends ApplicationError {
//   constructor(message: string, cause?: Error) {
//     super(message, cause);
//     this.name = 'CategoryError';
//   }
// }

// export class CategoryNotFoundError extends NotFoundError {
//   constructor(identifier: string) {
//     super(`Category not found: ${identifier}`);
//     this.name = 'CategoryNotFoundError';
//     this.metadata = { identifier };
//   }
// }

// export class CategoryValidationError extends ValidationError {
//   constructor(message: string, public validationErrors: ValidationError[] = []) {
//     super(message);
//     this.name = 'CategoryValidationError';
//     this.metadata = { validationErrors };
//   }
// }

// export class DuplicateCategoryError extends ConflictError {
//   constructor(field: string, value: string) {
//     super(`Category with ${field} "${value}" already exists`);
//     this.name = 'DuplicateCategoryError';
//     this.metadata = { field, value };
//   }
// }

// export class CircularReferenceError extends CategoryError {
//   constructor(categoryId: string, parentId: string) {
//     super(`Cannot set parent to ${parentId} as it would create a circular reference`);
//     this.name = 'CircularReferenceError';
//     this.metadata = { categoryId, parentId };
//   }
// }

// export class CategoryOperationError extends CategoryError {
//   constructor(operation: string, reason: string, metadata?: Record<string, any>) {
//     super(`Failed to ${operation} category: ${reason}`);
//     this.name = 'CategoryOperationError';
//     this.metadata = { operation, reason, ...metadata };
//   }
// }

// export class CategoryHierarchyError extends CategoryError {
//   constructor(message: string, metadata?: Record<string, any>) {
//     super(message);
//     this.name = 'CategoryHierarchyError';
//     this.metadata = metadata;
//   }
// }

import { Validator } from "../business";
import { CategoryCreateInput, CategoryUpdateInput } from './types';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// src/lib/services/category/validators.ts
export class CategoryValidator implements Validator {
  private errors: ValidationError[] = [];
  
  constructor(
    private input: CategoryCreateInput | CategoryUpdateInput,
    private config: ConfigManager
  ) {}

  async validate(): Promise<ValidationResult> {
    this.validateName();
    this.validateSlug();
    this.validateDescription();
    this.validateImage();
    this.validateSortOrder();
    this.validateMetadata();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  private validateName() {
    const minLength = this.config.get('category.validation.name.minLength', 2);
    const maxLength = this.config.get('category.validation.name.maxLength', 100);
    
    if (!this.input.name) {
      this.errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: 'Category name is required'
      });
    } else if (this.input.name.length < minLength) {
      this.errors.push({
        field: 'name',
        code: 'MIN_LENGTH',
        message: `Category name must be at least ${minLength} characters long`
      });
    } else if (this.input.name.length > maxLength) {
      this.errors.push({
        field: 'name',
        code: 'MAX_LENGTH',
        message: `Category name must not exceed ${maxLength} characters`
      });
    } else if (!/^[\w\s-]+$/i.test(this.input.name)) {
      this.errors.push({
        field: 'name',
        code: 'INVALID_FORMAT',
        message: 'Category name contains invalid characters'
      });
    }
  }

  private validateSlug() {
    if (!this.input.slug) return; // Slug is optional as it can be auto-generated

    const maxLength = this.config.get('category.validation.slug.maxLength', 100);
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (this.input.slug.length > maxLength) {
      this.errors.push({
        field: 'slug',
        code: 'MAX_LENGTH',
        message: `Slug must not exceed ${maxLength} characters`
      });
    } else if (!slugRegex.test(this.input.slug)) {
      this.errors.push({
        field: 'slug',
        code: 'INVALID_FORMAT',
        message: 'Slug format is invalid. Use lowercase letters, numbers, and hyphens only'
      });
    }
  }

  private validateDescription() {
    if (!this.input.description) return; // Description is optional

    const maxLength = this.config.get('category.validation.description.maxLength', 1000);

    if (this.input.description.length > maxLength) {
      this.errors.push({
        field: 'description',
        code: 'MAX_LENGTH',
        message: `Description must not exceed ${maxLength} characters`
      });
    }
  }

  private validateImage() {
    if (!this.input.image) return; // Image is optional

    try {
      const url = new URL(this.input.image);
      const allowedProtocols = ['http:', 'https:'];
      
      if (!allowedProtocols.includes(url.protocol)) {
        this.errors.push({
          field: 'image',
          code: 'INVALID_PROTOCOL',
          message: 'Image URL must use HTTP or HTTPS protocol'
        });
      }
    } catch {
      this.errors.push({
        field: 'image',
        code: 'INVALID_URL',
        message: 'Invalid image URL format'
      });
    }
  }

  private validateSortOrder() {
    if (this.input.sortOrder === undefined) return; // Sort order is optional

    if (!Number.isInteger(this.input.sortOrder)) {
      this.errors.push({
        field: 'sortOrder',
        code: 'INVALID_TYPE',
        message: 'Sort order must be an integer'
      });
    }

    const minOrder = this.config.get('category.validation.sortOrder.min', 0);
    const maxOrder = this.config.get('category.validation.sortOrder.max', 1000);

    if (this.input.sortOrder < minOrder || this.input.sortOrder > maxOrder) {
      this.errors.push({
        field: 'sortOrder',
        code: 'RANGE',
        message: `Sort order must be between ${minOrder} and ${maxOrder}`
      });
    }
  }

  private validateMetadata() {
    if (!this.input.metadata) return; // Metadata is optional

    try {
      const maxSize = this.config.get('category.validation.metadata.maxSize', 16384); // 16KB
      const serialized = JSON.stringify(this.input.metadata);
      
      if (serialized.length > maxSize) {
        this.errors.push({
          field: 'metadata',
          code: 'MAX_SIZE',
          message: `Metadata size exceeds maximum allowed size of ${maxSize} bytes`
        });
      }
    } catch {
      this.errors.push({
        field: 'metadata',
        code: 'INVALID_FORMAT',
        message: 'Metadata must be serializable'
      });
    }
  }
}

// export class CategoryHierarchyValidator implements Validator {
//   constructor(
//     private categoryId: string,
//     private parentId: string,
//     private categoryRepository: CategoryRepository,
//     private config: ConfigManager
//   ) {}

//   async validate(): Promise<ValidationResult> {
//     const errors: ValidationError[] = [];

//     // Check maximum depth
//     const maxDepth = this.config.get('category.validation.maxDepth', 5);
//     const depth = await this.calculateDepth(this.parentId);
    
//     if (depth >= maxDepth) {
//       errors.push({
//         field: 'parentId',
//         code: 'MAX_DEPTH',
//         message: `Category hierarchy cannot exceed ${maxDepth} levels`
//       });
//     }

//     // Check circular reference
//     if (await this.hasCircularReference(this.categoryId, this.parentId)) {
//       errors.push({
//         field: 'parentId',
//         code: 'CIRCULAR_REFERENCE',
//         message: 'Cannot create circular reference in category hierarchy'
//       });
//     }

//     // Check children count
//     const maxChildren = this.config.get('category.validation.maxChildren', 100);
//     const childrenCount = await this.getChildrenCount(this.parentId);
    
//     if (childrenCount >= maxChildren) {
//       errors.push({
//         field: 'parentId',
//         code: 'MAX_CHILDREN',
//         message: `Parent category cannot have more than ${maxChildren} children`
//       });
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }

//   private async calculateDepth(categoryId: string): Promise<number> {
//     let depth = 0;
//     let currentId = categoryId;

//     while (currentId) {
//       depth++;
//       const category = await this.categoryRepository.findById(currentId);
//       if (!category || !category.parentId) break;
//       currentId = category.parentId;
//     }

//     return depth;
//   }

//   private async hasCircularReference(categoryId: string, parentId: string): Promise<boolean> {
//     let currentId = parentId;
//     const visited = new Set<string>();

//     while (currentId) {
//       if (currentId === categoryId) return true;
//       if (visited.has(currentId)) return true;
      
//       visited.add(currentId);
//       const category = await this.categoryRepository.findById(currentId);
//       if (!category || !category.parentId) break;
      
//       currentId = category.parentId;
//     }

//     return false;
//   }

//   private async getChildrenCount(categoryId: string): Promise<number> {
//     const result = await this.categoryRepository.search({
//       parentId: categoryId,
//       limit: 0 // Only get count
//     });
//     return result.total;
//   }
// }

// // Additional specialized validators if needed
// export class CategorySlugValidator implements Validator {
//   constructor(
//     private slug: string,
//     private existingCategories: Category[],
//     private config: ConfigManager
//   ) {}

//   validate(): ValidationResult {
//     const errors: ValidationError[] = [];
//     const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
//     const maxLength = this.config.get('category.validation.slug.maxLength', 100);

//     if (!slugRegex.test(this.slug)) {
//       errors.push({
//         field: 'slug',
//         code: 'INVALID_FORMAT',
//         message: 'Invalid slug format'
//       });
//     }

//     if (this.slug.length > maxLength) {
//       errors.push({
//         field: 'slug',
//         code: 'MAX_LENGTH',
//         message: `Slug cannot exceed ${maxLength} characters`
//       });
//     }

//     if (this.existingCategories.some(category => category.slug === this.slug)) {
//       errors.push({
//         field: 'slug',
//         code: 'DUPLICATE',
//         message: 'Slug already exists'
//       });
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }
// }
