import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../ports/cart.repository';
import { assembleCart, CartView, MAX_QTY_PER_LINE } from '../../domain/cart';

export interface UpdateItemInput {
  userId: string;
  variantId: string;
  quantity: number;
}

/**
 * Fija la cantidad exacta de una línea del carrito (RF-MKT-003). Cantidad 0
 * elimina la línea. Valida límites y stock disponible.
 */
@Injectable()
export class UpdateItemUseCase {
  constructor(private readonly carts: CartRepository) {}

  async execute(input: UpdateItemInput): Promise<CartView> {
    const quantity = Math.trunc(input.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new BadRequestException('La cantidad debe ser un entero >= 0');
    }
    if (quantity > MAX_QTY_PER_LINE) {
      throw new BadRequestException(`Máximo ${MAX_QTY_PER_LINE} unidades por producto`);
    }

    const cartId = await this.carts.getOrCreateForUser(input.userId);
    if (!(await this.carts.hasItem(cartId, input.variantId))) {
      throw new NotFoundException('La línea no está en el carrito');
    }

    if (quantity === 0) {
      await this.carts.removeItem(cartId, input.variantId);
      return assembleCart(await this.carts.getLines(cartId));
    }

    const variant = await this.carts.getPurchasable(input.variantId);
    if (variant && quantity > variant.available) {
      throw new ConflictException(`Stock insuficiente: quedan ${variant.available} unidades`);
    }

    await this.carts.setQuantity(cartId, input.variantId, quantity);
    return assembleCart(await this.carts.getLines(cartId));
  }
}
