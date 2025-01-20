// src/lib/services/cart/service.ts

import { BaseBusinessService, RetryOptions } from '../business';
import { CartRepository } from './repository';
import { MonitoringSystem } from '../../monitoring';
import { CacheManager } from '../../cache';
import { Cart } from './types';
import { ProductService } from '../product';

export interface CartOperationOptions {
  skipCache?: boolean;
  invalidateCache?: boolean;
  retryOptions?: RetryOptions;
  // validateOptions?: {
  //   skipValidation?: boolean;
  //   customValidators?: ValidationRule[];
  // };
}

export interface Result<T> {
  data: T;
  errors?: Error[];
}

export class CartService extends BaseBusinessService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productService: ProductService,
    protected monitoring: MonitoringSystem,
    protected cacheManager: CacheManager,
    // private readonly eventBus: EventBus,
    // private readonly logger: Logger,
  ) {
    super(monitoring, cacheManager);
  }

  async getCart(
    userId: string,
    options?: CartOperationOptions
  ): Promise<Result<Cart>> {
    return this.createOperation(async () => {
      const cart = await this.cartRepository.findActiveCart(userId);
      
      if (!cart) {
        // throw new NotFoundError('Active cart not found');
        throw new Error('Active cart not found');
      }

      // await this.eventBus.publish('cart.viewed', {
      //   userId,
      //   cartId: cart.id,
      //   timestamp: new Date().toISOString()
      // });

      return cart;
    })
    .withCache(`cart:${userId}`, {
      ttl: 300000,
      skip: options?.skipCache
    })
    .withRetry({
      maxAttempts: options?.retryOptions?.maxAttempts ?? 3,
      getDelayMs: attempt => Math.pow(2, attempt) * 1000,
      // delay: options?.retryOptions?.delay ?? 1000,
      shouldRetry: options?.retryOptions?.shouldRetry ?? 
        // ((error) => error instanceof NetworkError)
        ((error) => error instanceof Error)
    })
    // .withErrorMapping({
    //   NotFoundError: () => new CartNotFoundError(userId),
    //   NetworkError: (error) => new ServiceUnavailableError('Cart service unavailable', error)
    // })
    .execute();
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    options?: CartOperationOptions
  ): Promise<Result<Cart>> {
    return this.createOperation(async () => {
      // Validate product existence and stock if required
      if (options?.validateStock) {
        const product = await this.productService.getProduct(productId);
        if (!product.data) {
          // throw new ValidationError('Product not found');
          throw new Error('Product not found');
        }
        if (product.data.stock < quantity) {
          // throw new ValidationError('Insufficient stock');
          throw new Error('Insufficient stock');
        }
      }

      const cart = await this.cartRepository.addItem(userId, {
        productId,
        quantity,
        // price: product.data.price // TODO
      });

      // await this.eventBus.publish('cart.item.added', {
      //   userId,
      //   cartId: cart.id,
      //   productId,
      //   quantity,
      //   timestamp: new Date().toISOString()
      // });

      return cart;
    })
    .withCache(`cart:${userId}`) // TODO: should???
    // .withValidation([
    //   new CartItemValidator({ productId, quantity })
    // ])
    // .withErrorMapping({
    //   ValidationError: (error) => new InvalidCartOperationError(error.message),
    //   NetworkError: (error) => new ServiceUnavailableError('Cart service unavailable', error)
    // })
    .execute();
  }

  // async updateItemQuantity(
  //   userId: string,
  //   itemId: string,
  //   quantity: number,
  //   options?: CartOperationOptions
  // ): Promise<Result<Cart>> {
  //   return this.createOperation(async () => {
  //     const cart = await this.cartRepository.updateItem(userId, itemId, {
  //       quantity
  //     });

  //     await this.eventBus.publish('cart.item.updated', {
  //       userId,
  //       cartId: cart.id,
  //       itemId,
  //       quantity,
  //       timestamp: new Date().toISOString()
  //     });

  //     return cart;
  //   })
  //   .withValidation([
  //     new CartItemValidator({ quantity })
  //   ])
  //   .withErrorMapping({
  //     NotFoundError: () => new CartItemNotFoundError(itemId),
  //     ValidationError: (error) => new InvalidCartOperationError(error.message)
  //   })
  //   .execute();
  // }

  // async removeItem(
  //   userId: string,
  //   itemId: string,
  //   options?: CartOperationOptions
  // ): Promise<Result<Cart>> {
  //   return this.createOperation(async () => {
  //     const cart = await this.cartRepository.removeItem(userId, itemId);

  //     await this.eventBus.publish('cart.item.removed', {
  //       userId,
  //       cartId: cart.id,
  //       itemId,
  //       timestamp: new Date().toISOString()
  //     });

  //     return cart;
  //   })
  //   .withErrorMapping({
  //     NotFoundError: () => new CartItemNotFoundError(itemId)
  //   })
  //   .execute();
  // }

  // async clearCart(
  //   userId: string,
  //   options?: CartOperationOptions
  // ): Promise<Result<void>> {
  //   return this.createOperation(async () => {
  //     await this.cartRepository.clearCart(userId);

  //     await this.eventBus.publish('cart.cleared', {
  //       userId,
  //       timestamp: new Date().toISOString()
  //     });
  //   })
  //   .withErrorMapping({
  //     NotFoundError: () => new CartNotFoundError(userId)
  //   })
  //   .execute();
  // }

  // // Additional business logic methods
  // async abandonCart(userId: string): Promise<Result<void>> {
  //   return this.createOperation(async () => {
  //     const cart = await this.cartRepository.findActiveCart(userId);
  //     if (!cart) return;

  //     await this.cartRepository.updateCart(userId, {
  //       status: 'abandoned',
  //       metadata: {
  //         abandonedAt: new Date().toISOString()
  //       }
  //     });

  //     await this.eventBus.publish('cart.abandoned', {
  //       userId,
  //       cartId: cart.id,
  //       items: cart.items,
  //       timestamp: new Date().toISOString()
  //     });
  //   })
  //   .execute();
  // }

  // async recalculateCart(userId: string): Promise<Result<Cart>> {
  //   return this.createOperation(async () => {
  //     const cart = await this.cartRepository.findActiveCart(userId);
  //     if (!cart) {
  //       throw new CartNotFoundError(userId);
  //     }

  //     // Recalculate totals
  //     let subtotal = 0;
  //     for (const item of cart.items) {
  //       const product = await this.productService.getProduct(item.productId);
  //       if (!product.data) {
  //         throw new ValidationError(`Product ${item.productId} not found`);
  //       }
  //       subtotal += product.data.price * item.quantity;
  //     }

  //     const tax = subtotal * this.config.get('cart.taxRate', 0);
  //     const total = subtotal + tax;

  //     return this.cartRepository.updateCart(userId, {
  //       subtotal,
  //       tax,
  //       total,
  //       metadata: {
  //         lastRecalculatedAt: new Date().toISOString()
  //       }
  //     });
  //   })
  //   .withErrorMapping({
  //     ValidationError: (error) => new InvalidCartOperationError(error.message)
  //   })
  //   .execute();
  // }
}
