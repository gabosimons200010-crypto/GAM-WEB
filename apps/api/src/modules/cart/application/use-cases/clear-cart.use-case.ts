import { Injectable } from '@nestjs/common';
import { CartRepository } from '../ports/cart.repository';

/** Vacía por completo el carrito del usuario (RF-MKT-003). */
@Injectable()
export class ClearCartUseCase {
  constructor(private readonly carts: CartRepository) {}

  async execute(userId: string): Promise<void> {
    const cartId = await this.carts.getOrCreateForUser(userId);
    await this.carts.clear(cartId);
  }
}
