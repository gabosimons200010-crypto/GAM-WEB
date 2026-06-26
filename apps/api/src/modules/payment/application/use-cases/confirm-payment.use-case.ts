import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../ports/payment.repository';
import { OutboxPublisher } from '../../../../shared/events/outbox';

export type WebhookOutcome = 'CONFIRMED' | 'FAILED' | 'EXPIRED';

export interface WebhookInput {
  provider: string;
  externalId: string; // id del evento en el proveedor (idempotencia)
  providerRef: string; // referencia del cobro
  outcome: WebhookOutcome;
  raw?: unknown;
}

export interface WebhookAck {
  status: 'processed' | 'duplicate' | 'ignored';
  orderNumber?: string;
}

/**
 * Procesa el webhook del proveedor de pagos (RF-MKT-006). Idempotente por
 * [provider, externalId]: un reintento del proveedor no re-aplica efectos. Si
 * el cobro se confirma, paga la orden (consume stock) y emite OrderPaid.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(input: WebhookInput): Promise<WebhookAck> {
    const payment = await this.payments.findByProviderRef(input.provider, input.providerRef);
    if (!payment) {
      throw new NotFoundException('Cobro no encontrado para esa referencia');
    }

    const first = await this.payments.recordWebhookOnce(input.provider, input.externalId, payment.id, input.raw ?? input);
    if (!first) {
      return { status: 'duplicate' };
    }

    if (input.outcome !== 'CONFIRMED') {
      await this.payments.markUnpaid(payment.id, input.outcome);
      return { status: 'processed' };
    }

    const result = await this.payments.markPaid(payment.id);
    if (result.changed) {
      await this.outbox.publish({
        aggregate: 'Order',
        aggregateId: result.orderId,
        type: 'OrderPaid',
        payload: { orderNumber: result.number, paymentId: payment.id, provider: input.provider },
      });
    }
    return { status: result.changed ? 'processed' : 'duplicate', orderNumber: result.number };
  }
}
