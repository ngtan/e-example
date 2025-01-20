// src/lib/services/cart/repository.ts

import { Cart, CartItem } from './types';

export class CartRepository {
  constructor(
    // private readonly httpClient: HttpClient,
    // private readonly config: ConfigManager,
    // private readonly cache: CacheManager,

    private readonly httpClient: any,
    private readonly config: any,
    private readonly cache: any,
  ) {}

  // async findActiveCart(userId: string): Promise<Cart | null> {
  //   return this.httpClient.get<Cart>(
  //     `/carts/${userId}/active`,
  //     {
  //       cache: {
  //         key: `cart:${userId}`,
  //         ttl: this.config.get('cart.cacheTTL', 300000), // 5 minutes
  //       }
  //     }
  //   );
  // }

  async addItem(userId: string, item: Partial<CartItem>): Promise<Cart> {
    // return this.httpClient.post<Cart>(
    //   `/carts/${userId}/items`,
    //   item,
    //   {
    //     cache: {
    //       invalidate: [`cart:${userId}`]
    //     }
    //   }
    // );

    try {
      const response = await this.httpClient.post(`carts/${userId}/items`);
      return response.data;
    } catch (error) {
      console.log('CartRepository.addItem', error);
      return {} as Cart;
    }
  }

  async updateItem(userId: string, itemId: string, updates: Partial<CartItem>): Promise<Cart> {
    // return this.httpClient.patch<Cart>(
    //   `/carts/${userId}/items/${itemId}`,
    //   updates,
    //   {
    //     cache: {
    //       invalidate: [`cart:${userId}`]
    //     }
    //   }
    // );

    try {
      const response = await this.httpClient.put(`carts/${userId}/items/${itemId}`, updates);
      return response.data;
    } catch (error) {
      console.log('CartRepository.updateItem', error);
      return {} as Cart;
    }
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    // return this.httpClient.delete<Cart>(
    //   `/carts/${userId}/items/${itemId}`,
    //   {
    //     cache: {
    //       invalidate: [`cart:${userId}`]
    //     }
    //   }
    // );

    try {
      const response = await this.httpClient.delete(`carts/${userId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.log('CartRepository.removeItem', error);
      return {} as Cart;
    }
  }

  // async clearCart(userId: string): Promise<void> {
  //   return this.httpClient.delete(
  //     `/carts/${userId}`,
  //     {
  //       cache: {
  //         invalidate: [`cart:${userId}`]
  //       }
  //     }
  //   );
  // }
}
