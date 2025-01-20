// src/lib/services/cart/errors.ts
export class CartNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`Cart not found for user ${userId}`);
    this.name = 'CartNotFoundError';
  }
}

export class CartItemNotFoundError extends NotFoundError {
  constructor(itemId: string) {
    super(`Cart item ${itemId} not found`);
    this.name = 'CartItemNotFoundError';
  }
}

export class InvalidCartOperationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCartOperationError';
  }
}
