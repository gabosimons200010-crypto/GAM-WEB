import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../ports/cart.repository';
import { assembleCart, CartView, isPurchasable, MAX_QTY_PER_LINE } from '../../domain/cart';

export interface AddItemInput {
  userId: string;
  variantId: string;
  quantity: number;
}

/**
 * Agrega una variante al carrito (RF-MKT-003). Valida que el producto sea
 * comprable (ACTIVE + tienda APPROVED) y que haya stock para la cantidad
 * total resultante. Devuelve el carrito actualizado.
 */
@Injectable()
export class AddItemUseCase {
  constructor(private readonly carts: CartRepository) {}

  async execute(input: AddItemInput): Promise<CartView> {
    const quantity = Math.trunc(input.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new BadRequestException('La cantidad debe ser un entero >= 1');
    }

    const variant = await this.carts.getPurchasable(input.variantId);
    if (!variant) {
      throw new NotFoundException('La variante no existe');
    }
    if (!isPurchasable({ productStatus: variant.productStatus, storeStatus: variant.storeStatus })) {
      throw new ConflictException('El producto no está disponible para la venta');
    }

    const cartId = await this.carts.getOrCreateForUser(input.userId);
    const lines = await this.carts.getLines(cartId);
    const existing = lines.find((l) => l.variantId === input.variantId)?.quantity ?? 0;
    const desired = existing + quantity;

    if (desired > MAX_QTY_PER_LINE) {
      throw new BadRequestException(`Máximo ${MAX_QTY_PER_LINE} unidades por producto`);
    }
    if (desired > variant.available) {
      throw new ConflictException(`Stock insuficiente: quedan ${variant.available} unidades`);
    }

    await this.carts.addOrIncrement(cartId, input.variantId, quantity);
    return assembleCart(await this.carts.getLines(cartId));
  }
}
