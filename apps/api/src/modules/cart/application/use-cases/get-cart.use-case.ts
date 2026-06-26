import { Injectable } from '@nestjs/common';
import { CartRepository } from '../ports/cart.repository';
import { assembleCart, CartView } from '../../domain/cart';

/** Devuelve el carrito del usuario agrupado por tienda con totales (RF-MKT-003). */
@Injectable()
export class GetCartUseCase {
  constructor(private readonly carts: CartRepository) {}

  async execute(userId: string): Promise<CartView> {
    const cartId = await this.carts.getOrCreateForUser(userId);
    const lines = await this.carts.getLines(cartId);
    return assembleCart(lines);
  }
}
