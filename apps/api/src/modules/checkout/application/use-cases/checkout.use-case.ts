import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CartRepository } from '../../../cart/application/ports/cart.repository';
import { OrderRepository, OrderSummaryView, ShippingAddress, BuyerInfo } from '../ports/order.repository';
import { buildOrderDraft, findUnavailable, reservationExpiry } from '../../domain/order';

export interface CheckoutInput {
  userId: string;
  address: ShippingAddress;
  buyer: BuyerInfo;
}

/**
 * Convierte el carrito del usuario en una orden (RF-MKT-004). Revalida que
 * todas las líneas sean comprables y tengan stock, arma la orden dividida por
 * tienda, reserva el inventario y deja la orden en PENDING_PAYMENT. Vacía el
 * carrito al confirmar. El cobro se hace en el Sprint 10 (pagos).
 */
@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly carts: CartRepository,
    private readonly orders: OrderRepository,
  ) {}

  async execute(input: CheckoutInput): Promise<OrderSummaryView> {
    const cartId = await this.carts.getOrCreateForUser(input.userId);
    const lines = await this.carts.getLines(cartId);

    if (lines.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const unavailable = findUnavailable(lines);
    if (unavailable.length > 0) {
      throw new ConflictException({
        message: 'Hay productos no disponibles en tu carrito. Ajústalo antes de continuar.',
        unavailable,
      });
    }

    const draft = buildOrderDraft(lines);
    const order = await this.orders.placeOrder({
      userId: input.userId,
      buyer: input.buyer,
      address: input.address,
      draft,
      reservationExpiresAt: reservationExpiry(new Date()),
    });

    // El stock ya está reservado: vaciar el carrito evita doble pedido.
    await this.carts.clear(cartId);
    return order;
  }
}
