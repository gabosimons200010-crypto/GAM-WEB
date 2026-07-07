import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository, PaymentView } from '../ports/payment.repository';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { PaymentMethod } from '../../domain/payment';

export interface CreatePaymentInput {
  userId: string | null; // null = pago de una orden de invitado
  orderId: string;
  method: PaymentMethod;
  cardToken?: string | null;
}

/**
 * Inicia el cobro de una orden (RF-MKT-006). Valida que la orden sea del
 * usuario y esté pendiente de pago, pide el cobro al gateway (QR para
 * Yape/Plin) y registra el Payment en PENDING. La confirmación llega por
 * webhook.
 */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly gateway: PaymentGatewayPort,
  ) {}

  async execute(input: CreatePaymentInput): Promise<PaymentView> {
    const order = input.userId
      ? await this.payments.getPayableOrder(input.orderId, input.userId)
      : await this.payments.getPayableGuestOrder(input.orderId);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictException('La orden no está pendiente de pago');
    }
    if (await this.payments.hasConfirmedPayment(order.id)) {
      throw new ConflictException('La orden ya fue pagada');
    }

    const charge = await this.gateway.createCharge({
      method: input.method,
      amount: order.grandTotal,
      currency: 'PEN',
      orderNumber: order.number,
      cardToken: input.cardToken ?? null,
    });

    return this.payments.create({
      orderId: order.id,
      method: input.method,
      amount: order.grandTotal,
      provider: charge.provider,
      providerRef: charge.providerRef,
      qrPayload: charge.qrPayload ?? null,
      expiresAt: charge.expiresAt ?? null,
      cardToken: input.cardToken ?? null,
    });
  }
}
