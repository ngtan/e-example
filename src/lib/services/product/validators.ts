// src/lib/services/product/validators.ts

import { Validator } from "../business";

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ProductCreateInput {
  name: string;
  price: number;
  stock?: number;
  categories: string[];
  sku?: string;
  slug?: string;
  metadata?: Record<string, any>;
}

export interface ProductUpdateInput {
  name?: string;
  price?: number;
  stock?: number;
  categories?: string[];
  sku?: string;
  slug?: string;
  metadata?: Record<string, any>;
}

export class ProductValidator implements Validator {
  private errors: ValidationError[] = [];

  constructor(
    private product: ProductCreateInput | ProductUpdateInput,
    private config: ConfigManager
  ) {}

  async validate(): Promise<ValidationResult> {
    this.validateName();
    this.validatePrice();
    this.validateStock();
    this.validateCategories();
    this.validateSku();
    this.validateSlug();
    this.validateMetadata();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  private validateName() {
    const minLength = this.config.get('category.validation.name.minLength', 3);
    const maxLength = this.config.get('category.validation.name.maxLength', 200);

    if (!this.product.name) {
      this.errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: 'Product name is required'
      });
    } else if (this.product.name.length < minLength) {
      this.errors.push({
        field: 'name',
        code: 'MIN_LENGTH',
        message: `Product name must be at least ${minLength} characters long`,
      });
    } else if (this.product.name.length > maxLength) {
      this.errors.push({
        field: 'name',
        code: 'MAX_LENGTH',
        message: `Product name must not exceed ${maxLength} characters`
      });
    } else if (!/^[\w\s-]+$/i.test(this.product.name)) {
      this.errors.push({
        field: 'name',
        code: 'INVALID_FORMAT',
        message: 'Product name contains invalid characters'
      });
    }
  }

  private validatePrice() {
    if (typeof this.product.price !== 'number') {
      this.errors.push({
        field: 'price',
        code: 'NUMBER',
        message: 'Product price must be a number'
      });
    } else if (this.product.price < 0) {
      this.errors.push({
        field: 'price',
        code: 'NUMBER_NEGATIVE',
        message: 'Product price cannot be negative'
      });
    } else if (this.product.price > 1000000) {
      this.errors.push({
        field: 'price',
        code: 'NUMBER_TOO_LARGE',
        message: 'Product price exceeds maximum allowed value'
      });
    }
  }

  private validateStock() {
    if ('stock' in this.product) {
      if (typeof this.product.stock !== 'number') {
        this.errors.push({
          field: 'stock',
          message: 'Product stock must be a number'
        });
      } else if (this.product.stock < 0) {
        this.errors.push({
          field: 'stock',
          message: 'Product stock cannot be negative'
        });
      }
    }
  }

  private validateCategories() {
    if (this.product.categories?.length === 0) {
      this.errors.push({
        field: 'categories',
        message: 'Product must have at least one category'
      });
    }
  }

  private validateSku() {
    if ('sku' in this.product && this.product.sku) {
      if (!/^[A-Z0-9]{6,20}$/.test(this.product.sku)) {
        this.errors.push({
          field: 'sku',
          message: 'SKU must be 6-20 characters long and contain only uppercase letters and numbers'
        });
      }
    }
  }

  private validateSlug() {
    if ('slug' in this.product && this.product.slug) {
      if (!/^[a-z0-9-]{3,50}$/.test(this.product.slug)) {
        this.errors.push({
          field: 'slug',
          message: 'Slug must be 3-50 characters long and contain only lowercase letters, numbers, and hyphens'
        });
      }
    }
  }

  private validateMetadata() {
    if (this.product.metadata) {
      try {
        JSON.stringify(this.product.metadata);
      } catch {
        this.errors.push({
          field: 'metadata',
          message: 'Metadata must be serializable'
        });
      }
    }
  }
}

// export class ProductPriceValidator implements Validator {
//   constructor(
//     private price: number,
//     private currency: string,
//     private config: ConfigManager
//   ) {}

//   validate(): ValidationResult {
//     const errors: ValidationError[] = [];
//     const currencyConfig = this.config.get(`pricing.${this.currency}`, {});

//     if (this.price < currencyConfig.minPrice || 0) {
//       errors.push({
//         field: 'price',
//         message: `Price cannot be less than ${currencyConfig.minPrice || 0} ${this.currency}`
//       });
//     }

//     if (this.price > currencyConfig.maxPrice || 1000000) {
//       errors.push({
//         field: 'price',
//         message: `Price cannot exceed ${currencyConfig.maxPrice || 1000000} ${this.currency}`
//       });
//     }

//     const decimalPlaces = (this.price.toString().split('.')[1] || '').length;
//     if (decimalPlaces > (currencyConfig.decimals || 2)) {
//       errors.push({
//         field: 'price',
//         message: `Price cannot have more than ${currencyConfig.decimals || 2} decimal places for ${this.currency}`
//       });
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }
// }

// export class ProductStockValidator implements Validator {
//   constructor(
//     private stock: number,
//     private minStock: number = 0,
//     private maxStock: number = 999999
//   ) {}

//   validate(): ValidationResult {
//     const errors: ValidationError[] = [];

//     if (!Number.isInteger(this.stock)) {
//       errors.push({
//         field: 'stock',
//         message: 'Stock quantity must be a whole number'
//       });
//     }

//     if (this.stock < this.minStock) {
//       errors.push({
//         field: 'stock',
//         message: `Stock cannot be less than ${this.minStock}`
//       });
//     }

//     if (this.stock > this.maxStock) {
//       errors.push({
//         field: 'stock',
//         message: `Stock cannot exceed ${this.maxStock}`
//       });
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }
// }

// export class ProductImageValidator implements Validator {
//   constructor(
//     private image: ProductImage,
//     private config: ConfigManager
//   ) {}

//   validate(): ValidationResult {
//     const errors: ValidationError[] = [];
//     const imageConfig = this.config.get('product.images', {});

//     if (!this.image.url) {
//       errors.push({
//         field: 'image.url',
//         message: 'Image URL is required'
//       });
//     } else if (!this.isValidImageUrl(this.image.url)) {
//       errors.push({
//         field: 'image.url',
//         message: 'Invalid image URL format'
//       });
//     }

//     if (this.image.size > (imageConfig.maxSize || 5 * 1024 * 1024)) {
//       errors.push({
//         field: 'image.size',
//         message: `Image size cannot exceed ${imageConfig.maxSize || 5}MB`
//       });
//     }

//     if (!imageConfig.allowedTypes?.includes(this.image.type)) {
//       errors.push({
//         field: 'image.type',
//         message: `Invalid image type. Allowed types: ${imageConfig.allowedTypes?.join(', ')}`
//       });
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }

//   private isValidImageUrl(url: string): boolean {
//     try {
//       new URL(url);
//       return true;
//     } catch {
//       return false;
//     }
//   }
// }

// export class ProductCategoryValidator implements Validator {
//   constructor(
//     private categories: string[],
//     private categoryService: CategoryService
//   ) {}

//   async validate(): Promise<ValidationResult> {
//     const errors: ValidationError[] = [];

//     if (!Array.isArray(this.categories)) {
//       errors.push({
//         field: 'categories',
//         message: 'Categories must be an array'
//       });
//       return { isValid: false, errors };
//     }

//     if (this.categories.length === 0) {
//       errors.push({
//         field: 'categories',
//         message: 'At least one category is required'
//       });
//       return { isValid: false, errors };
//     }

//     // Validate each category exists
//     const validationPromises = this.categories.map(async (categoryId) => {
//       const category = await this.categoryService.getCategory(categoryId);
//       if (!category.data) {
//         errors.push({
//           field: 'categories',
//           message: `Category ${categoryId} does not exist`
//         });
//       }
//     });

//     await Promise.all(validationPromises);

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }
// }
