import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreatePaymentUseCase } from './create-payment.use-case';
import { PaymentRepository, PayableOrder, PaymentView, CreatePaymentData } from '../ports/payment.repository';
import { PaymentGatewayPort, ChargeRequest, ChargeResult } from '../ports/payment-gateway.port';

class FakePayments extends PaymentRepository {
  public created?: CreatePaymentData;
  constructor(
    private readonly order: PayableOrder | null,
    private readonly confirmed = false,
  ) {
    super();
  }
  async getPayableOrder() {
    return this.order;
  }
  async hasConfirmedPayment() {
    return this.confirmed;
  }
  async create(data: CreatePaymentData): Promise<PaymentView> {
    this.created = data;
    return {
      id: 'pay1',
      orderId: data.orderId,
      method: data.method,
      status: 'PENDING',
      amount: data.amount,
      qrPayload: data.qrPayload ?? null,
      providerRef: data.providerRef,
      expiresAt: data.expiresAt ?? null,
    };
  }
  findByProviderRef(): never {
    throw new Error('n/a');
  }
  recordWebhookOnce(): never {
    throw new Error('n/a');
  }
  markPaid(): never {
    throw new Error('n/a');
  }
  markUnpaid(): never {
    throw new Error('n/a');
  }
}

class FakeGateway extends PaymentGatewayPort {
  public req?: ChargeRequest;
  async createCharge(req: ChargeRequest): Promise<ChargeResult> {
    this.req = req;
    return { provider: 'stub-yape', providerRef: 'ref_x', qrPayload: 'qr://x', expiresAt: new Date() };
  }
}

const ORDER: PayableOrder = { id: 'o1', number: 'GG-0001', status: 'PENDING_PAYMENT', grandTotal: 130 };

describe('CreatePaymentUseCase', () => {
  it('crea el cobro con el monto de la orden y devuelve el QR', async () => {
    const payments = new FakePayments(ORDER);
    const gateway = new FakeGateway();
    const res = await new CreatePaymentUseCase(payments, gateway).execute({ userId: 'u1', orderId: 'o1', method: 'YAPE' });

    expect(gateway.req?.amount).toBe(130);
    expect(payments.created?.amount).toBe(130);
    expect(payments.created?.providerRef).toBe('ref_x');
    expect(res.qrPayload).toBe('qr://x');
  });

  it('rechaza si la orden no existe (o no es del usuario)', async () => {
    await expect(
      new CreatePaymentUseCase(new FakePayments(null), new FakeGateway()).execute({ userId: 'u1', orderId: 'x', method: 'YAPE' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza si la orden no está pendiente de pago', async () => {
    const payments = new FakePayments({ ...ORDER, status: 'PAID' });
    await expect(
      new CreatePaymentUseCase(payments, new FakeGateway()).execute({ userId: 'u1', orderId: 'o1', method: 'YAPE' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza si la orden ya tiene un pago confirmado', async () => {
    const payments = new FakePayments(ORDER, true);
    await expect(
      new CreatePaymentUseCase(payments, new FakeGateway()).execute({ userId: 'u1', orderId: 'o1', method: 'YAPE' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
