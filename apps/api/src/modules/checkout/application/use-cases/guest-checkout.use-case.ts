import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CouponsRepository } from '../../../coupons/application/ports/coupons.repository';
import { evaluateCoupon } from '../../../coupons/domain/coupon';
import { OrderRepository, OrderSummaryView, ShippingAddress, BuyerInfo } from '../ports/order.repository';
import { GuestItemInput, PurchasableLinesPort } from '../ports/purchasable-lines.port';
import { buildOrderDraft, findUnavailable, reservationExpiry, round2 } from '../../domain/order';

export interface GuestCheckoutInput {
  items: GuestItemInput[];
  address: ShippingAddress;
  buyer: BuyerInfo; // email obligatorio para el invitado
  couponCode?: string;
}

/**
 * Checkout sin cuenta (RF-MKT-004b). Recibe los ítems directamente (no hay
 * carrito en el servidor), revalida stock, arma la orden con los datos del
 * invitado (guestEmail) y reserva el inventario. El pago va por /payments/guest.
 */
@Injectable()
export class GuestCheckoutUseCase {
  constructor(
    private readonly lines: PurchasableLinesPort,
    private readonly orders: OrderRepository,
    private readonly coupons: CouponsRepository,
  ) {}

  async execute(input: GuestCheckoutInput): Promise<OrderSummaryView> {
    if (!input.buyer.email) {
      throw new BadRequestException('El correo es obligatorio para comprar como invitado');
    }
    if (!input.items?.length) {
      throw new BadRequestException('La cesta está vacía');
    }

    const lines = await this.lines.resolve(input.items);
    if (lines.length === 0) {
      throw new BadRequestException('Los productos ya no están disponibles');
    }

    const unavailable = findUnavailable(lines);
    if (unavailable.length > 0) {
      throw new ConflictException({
        message: 'Hay productos no disponibles en tu cesta. Ajústala antes de continuar.',
        unavailable,
      });
    }

    const draft = buildOrderDraft(lines, input.address.department);

    if (input.couponCode) {
      const coupon = await this.coupons.findByCode(input.couponCode);
      const result = evaluateCoupon(coupon, draft.subtotal, new Date());
      if (result.valid && result.discount > 0) {
        draft.discountTotal = result.discount;
        draft.grandTotal = round2(draft.subtotal + draft.shippingTotal - result.discount);
      }
    }

    return this.orders.placeOrder({
      userId: null,
      buyer: input.buyer,
      address: input.address,
      draft,
      reservationExpiresAt: reservationExpiry(new Date()),
    });
  }
}
