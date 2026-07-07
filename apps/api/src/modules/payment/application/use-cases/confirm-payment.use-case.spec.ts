import { NotFoundException } from '@nestjs/common';
import { ConfirmPaymentUseCase } from './confirm-payment.use-case';
import { PaymentRepository, PaymentRef, PaidResult } from '../ports/payment.repository';
import { OutboxPublisher, DomainEvent } from '../../../../shared/events/outbox';

class FakePayments extends PaymentRepository {
  public markedPaid = 0;
  public markedUnpaid?: string;
  public webhookSeen = new Set<string>();
  constructor(
    private readonly payment: PaymentRef | null,
    private readonly paidResult: PaidResult = { orderId: 'o1', number: 'GG-0001', changed: true },
  ) {
    super();
  }
  async findByProviderRef() {
    return this.payment;
  }
  async recordWebhookOnce(provider: string, externalId: string) {
    const key = `${provider}:${externalId}`;
    if (this.webhookSeen.has(key)) return false;
    this.webhookSeen.add(key);
    return true;
  }
  async markPaid() {
    this.markedPaid += 1;
    return this.paidResult;
  }
  async markUnpaid(_id: string, status: 'FAILED' | 'EXPIRED') {
    this.markedUnpaid = status;
  }
  getPayableOrder(): never {
    throw new Error('n/a');
  }
  getPayableGuestOrder(): never {
    throw new Error('n/a');
  }
  hasConfirmedPayment(): never {
    throw new Error('n/a');
  }
  create(): never {
    throw new Error('n/a');
  }
}

class FakeOutbox extends OutboxPublisher {
  public events: DomainEvent[] = [];
  async publish(e: DomainEvent) {
    this.events.push(e);
  }
}

const PAYMENT: PaymentRef = { id: 'pay1', orderId: 'o1', status: 'PENDING' };

function build(payment: PaymentRef | null, paid?: PaidResult) {
  const payments = new FakePayments(payment, paid);
  const outbox = new FakeOutbox();
  return { useCase: new ConfirmPaymentUseCase(payments, outbox), payments, outbox };
}

describe('ConfirmPaymentUseCase', () => {
  const base = { provider: 'stub-yape', externalId: 'evt1', providerRef: 'ref1' };

  it('confirma el pago, marca la orden pagada y emite OrderPaid', async () => {
    const { useCase, payments, outbox } = build(PAYMENT);
    const ack = await useCase.execute({ ...base, outcome: 'CONFIRMED' });

    expect(payments.markedPaid).toBe(1);
    expect(ack.status).toBe('processed');
    expect(ack.orderNumber).toBe('GG-0001');
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0].type).toBe('OrderPaid');
  });

  it('es idempotente: un webhook repetido no vuelve a pagar ni re-emite', async () => {
    const { useCase, payments, outbox } = build(PAYMENT);
    await useCase.execute({ ...base, outcome: 'CONFIRMED' });
    const second = await useCase.execute({ ...base, outcome: 'CONFIRMED' });

    expect(second.status).toBe('duplicate');
    expect(payments.markedPaid).toBe(1); // no se reaplicó
    expect(outbox.events).toHaveLength(1);
  });

  it('no emite OrderPaid si la orden ya estaba pagada (markPaid sin cambio)', async () => {
    const { useCase, outbox } = build(PAYMENT, { orderId: 'o1', number: 'GG-0001', changed: false });
    const ack = await useCase.execute({ ...base, outcome: 'CONFIRMED' });
    expect(ack.status).toBe('duplicate');
    expect(outbox.events).toHaveLength(0);
  });

  it('ante FAILED marca el pago como fallido sin tocar la orden', async () => {
    const { useCase, payments, outbox } = build(PAYMENT);
    const ack = await useCase.execute({ ...base, outcome: 'FAILED' });
    expect(payments.markedUnpaid).toBe('FAILED');
    expect(payments.markedPaid).toBe(0);
    expect(outbox.events).toHaveLength(0);
    expect(ack.status).toBe('processed');
  });

  it('lanza 404 si no existe cobro para la referencia', async () => {
    const { useCase } = build(null);
    await expect(useCase.execute({ ...base, outcome: 'CONFIRMED' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
