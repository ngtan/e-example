// src/lib/services/cart/errors.ts

export class CartError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CartError';
  }
}

export class CartNotFoundError extends Error {
  constructor(userId: string) {
    super(`Cart not found for user ${userId}`);
    this.name = 'CartNotFoundError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Cart item ${itemId} not found`);
    this.name = 'CartItemNotFoundError';
  }
}

// export class InvalidCartOperationError extends ValidationError {
//   constructor(message: string) {
//     super(message);
//     this.name = 'InvalidCartOperationError';
//   }
// }
