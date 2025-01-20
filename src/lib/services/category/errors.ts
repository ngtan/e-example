// src/lib/services/category/errors.ts
export class CategoryError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CategoryError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`Category not found: ${categoryId}`);
    this.name = 'CategoryNotFoundError';
    // this.metadata = { identifier };
  }
}

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
