// src/lib/services/cart/repository.ts
export class CartRepository extends BaseRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cache: CacheManager,
    private readonly config: ConfigManager
  ) {
    super();
  }

  async findActiveCart(userId: string): Promise<Cart | null> {
    return this.httpClient.get<Cart>(
      `/carts/${userId}/active`,
      {
        cache: {
          key: `cart:${userId}`,
          ttl: this.config.get('cart.cacheTTL', 300000), // 5 minutes
        }
      }
    );
  }

  async addItem(userId: string, item: Partial<CartItem>): Promise<Cart> {
    return this.httpClient.post<Cart>(
      `/carts/${userId}/items`,
      item,
      {
        cache: {
          invalidate: [`cart:${userId}`]
        }
      }
    );
  }

  async updateItem(userId: string, itemId: string, updates: Partial<CartItem>): Promise<Cart> {
    return this.httpClient.patch<Cart>(
      `/carts/${userId}/items/${itemId}`,
      updates,
      {
        cache: {
          invalidate: [`cart:${userId}`]
        }
      }
    );
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    return this.httpClient.delete<Cart>(
      `/carts/${userId}/items/${itemId}`,
      {
        cache: {
          invalidate: [`cart:${userId}`]
        }
      }
    );
  }

  async clearCart(userId: string): Promise<void> {
    return this.httpClient.delete(
      `/carts/${userId}`,
      {
        cache: {
          invalidate: [`cart:${userId}`]
        }
      }
    );
  }
}
