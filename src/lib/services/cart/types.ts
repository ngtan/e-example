// src/lib/services/cart/types.ts
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  // product: {
  //   name: string;
  //   slug: string;
  //   image: string;
  // };
  // metadata?: Record<string, any>;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: CartStatus;
  currency: string;
  metadata?: Record<string, any>;
  lastModified: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CartStatus = 'active' | 'abandoned' | 'converted';

// export interface CartOperationOptions {
//   skipCache?: boolean;
//   invalidateCache?: boolean;
//   validateStock?: boolean;
// }
