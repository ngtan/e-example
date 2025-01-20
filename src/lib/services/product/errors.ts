// src/lib/services/product/errors.ts
export class ProductError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ProductError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}

// export class InvalidProductDataError extends Error {
//   constructor(message: string, public validationErrors: string[]) {
//     super(message);
//     this.name = 'InvalidProductDataError';
//   }
// }

// export class ProductValidationError extends ValidationError {
//   constructor(message: string, public validationErrors: ValidationError[]) {
//     super(message);
//     this.name = 'ProductValidationError';
//     this.metadata = { validationErrors };
//   }
// }

// export class ProductPriceError extends ProductError {
//   constructor(message: string) {
//     super(message);
//     this.name = 'ProductPriceError';
//   }
// }

// export class ProductStockError extends ProductError {
//   constructor(productId: string, requestedQuantity: number, availableStock: number) {
//     super(`Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableStock}`);
//     this.name = 'ProductStockError';
//     this.metadata = {
//       productId,
//       requestedQuantity,
//       availableStock
//     };
//   }
// }

// export class ProductCategoryError extends ProductError {
//   constructor(categoryId: string) {
//     super(`Invalid category ${categoryId}`);
//     this.name = 'ProductCategoryError';
//   }
// }

// export class DuplicateProductError extends ConflictError {
//   constructor(field: string, value: string) {
//     super(`Product with ${field} "${value}" already exists`);
//     this.name = 'DuplicateProductError';
//     this.metadata = { field, value };
//   }
// }

// export class ProductOperationError extends ProductError {
//   constructor(operation: string, reason: string, cause?: Error) {
//     super(`Failed to ${operation} product: ${reason}`, cause);
//     this.name = 'ProductOperationError';
//     this.metadata = { operation, reason };
//   }
// }
