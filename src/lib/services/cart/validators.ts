// src/lib/services/cart/validators.ts
import { Validator } from "../business";
import { CartItem } from "./types";

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class CartItemValidator implements Validator {
  private errors: ValidationError[] = [];

  constructor(private item: Partial<CartItem>) {}

  async validate(): Promise<ValidationResult> {
    if (!this.item.productId) {
      this.errors.push({ field: 'productId', code: 'REQUIRED', message: 'Product ID is required' });
    }

    if (typeof this.item.quantity !== 'number' || this.item.quantity < 1) {
      this.errors.push({ field: 'quantity', code: 'NUMBER', message: 'Quantity must be a positive number' });
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }
}
