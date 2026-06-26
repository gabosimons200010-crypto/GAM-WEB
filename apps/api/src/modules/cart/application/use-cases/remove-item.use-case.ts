import { Injectable } from '@nestjs/common';
import { CartRepository } from '../ports/cart.repository';
import { assembleCart, CartView } from '../../domain/cart';

/** Elimina una línea del carrito (RF-MKT-003). Idempotente. */
@Injectable()
export class RemoveItemUseCase {
  constructor(private readonly carts: CartRepository) {}

  async execute(userId: string, variantId: string): Promise<CartView> {
    const cartId = await this.carts.getOrCreateForUser(userId);
    await this.carts.removeItem(cartId, variantId);
    return assembleCart(await this.carts.getLines(cartId));
  }
}
