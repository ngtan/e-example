// src/lib/services/cart/validators.ts
export class CartItemValidator implements Validator {
  constructor(private item: Partial<CartItem>) {}

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.item.productId) {
      errors.push({ field: 'productId', message: 'Product ID is required' });
    }

    if (typeof this.item.quantity !== 'number' || this.item.quantity < 1) {
      errors.push({ field: 'quantity', message: 'Quantity must be a positive number' });
    }

    return { isValid: errors.length === 0, errors };
  }
}
