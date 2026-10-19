import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../db/dbClient';
import { aggregatorService } from '../providers/aggregatorService';
import { CartItem, Product } from '../types/product';

export class CartService {
  public async getCart(userId: string = 'guest_default_session'): Promise<CartItem[]> {
    return dbClient.getCart(userId);
  }

  public async addToCart(product: Product, quantity = 1, userId: string = 'guest_default_session'): Promise<CartItem> {
    const existingItems = await dbClient.getCart(userId);
    const existing = existingItems.find(
      (item) => item.product.productId === product.productId && item.product.store === product.store
    );

    if (existing) {
      existing.quantity += quantity;
      existing.currentPrice = product.price;
      return dbClient.saveCartItem(existing, userId);
    }

    const newItem: CartItem = {
      id: uuidv4(),
      product,
      quantity,
      addedPrice: product.price,
      currentPrice: product.price,
      priceChanged: false,
      priceDelta: 0,
      addedAt: new Date().toISOString()
    };

    return dbClient.saveCartItem(newItem, userId);
  }

  public async removeFromCart(id: string, userId: string = 'guest_default_session'): Promise<boolean> {
    return dbClient.removeCartItem(id, userId);
  }

  public async clearCart(userId: string = 'guest_default_session'): Promise<void> {
    return dbClient.clearCart(userId);
  }

  public async mergeCart(guestUserId: string, targetUserId: string): Promise<CartItem[]> {
    return dbClient.mergeCart(guestUserId, targetUserId);
  }

  /**
   * Re-checks live prices across Amazon, Flipkart, and Meesho before checkout.
   * Identifies any price drops or increases.
   */
  public async verifyLivePrices(userId: string = 'guest_default_session'): Promise<{
    items: CartItem[];
    hasPriceChanges: boolean;
    totalSavingsOrIncrease: number;
  }> {
    const items = await dbClient.getCart(userId);
    let hasPriceChanges = false;
    let totalSavingsOrIncrease = 0;

    for (const item of items) {
      try {
        const liveProduct = await aggregatorService.getProductLive(item.product.store, item.product.productId);
        if (liveProduct && liveProduct.price > 0) {
          const delta = liveProduct.price - item.addedPrice;
          item.currentPrice = liveProduct.price;
          item.priceChanged = delta !== 0;
          item.priceDelta = delta;
          totalSavingsOrIncrease += delta * item.quantity;
          if (delta !== 0) hasPriceChanges = true;
          await dbClient.saveCartItem(item, userId);
        }
      } catch (err) {
        console.warn(`Could not verify live price for item ${item.product.productId}`);
      }
    }

    return {
      items,
      hasPriceChanges,
      totalSavingsOrIncrease
    };
  }
}

export const cartService = new CartService();
