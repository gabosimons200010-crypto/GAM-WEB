import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  PaymentRepository,
  PayableOrder,
  CreatePaymentData,
  PaymentView,
  PaymentRef,
  PaidResult,
} from '../application/ports/payment.repository';
import { PaymentMethod } from '../domain/payment';

@Injectable()
export class PrismaPaymentRepository extends PaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getPayableOrder(orderId: string, userId: string): Promise<PayableOrder | null> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, number: true, status: true, grandTotal: true },
    });
    if (!order) return null;
    return { id: order.id, number: order.number, status: order.status, grandTotal: Number(order.grandTotal) };
  }

  async getPayableGuestOrder(orderId: string): Promise<PayableOrder | null> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: null },
      select: { id: true, number: true, status: true, grandTotal: true },
    });
    if (!order) return null;
    return { id: order.id, number: order.number, status: order.status, grandTotal: Number(order.grandTotal) };
  }

  async hasConfirmedPayment(orderId: string): Promise<boolean> {
    return (await this.prisma.payment.count({ where: { orderId, status: 'CONFIRMED' } })) > 0;
  }

  async create(data: CreatePaymentData): Promise<PaymentView> {
    const p = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method as PrismaPaymentMethod,
        status: 'PENDING',
        amount: data.amount,
        currency: 'PEN',
        provider: data.provider,
        providerRef: data.providerRef,
        qrPayload: data.qrPayload ?? null,
        expiresAt: data.expiresAt ?? null,
        cardToken: data.cardToken ?? null,
      },
    });
    return this.toView(p);
  }

  async findByProviderRef(provider: string, providerRef: string): Promise<PaymentRef | null> {
    const p = await this.prisma.payment.findFirst({
      where: { provider, providerRef },
      select: { id: true, orderId: true, status: true },
    });
    return p ?? null;
  }

  async recordWebhookOnce(provider: string, externalId: string, paymentId: string | null, payload: unknown): Promise<boolean> {
    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider,
          externalId,
          paymentId,
          payload: (payload ?? {}) as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      return true;
    } catch (e) {
      // Choque de [provider, externalId] → ya se procesó: idempotente.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false;
      throw e;
    }
  }

  async markPaid(paymentId: string): Promise<PaidResult> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Pago no encontrado');

      const order = await tx.order.findUnique({ where: { id: payment.orderId }, select: { number: true, status: true } });
      if (!order) throw new NotFoundException('Orden no encontrada');

      // Idempotencia: si la orden ya está pagada, no reaplicar efectos de stock.
      if (order.status === 'PAID') {
        return { orderId: payment.orderId, number: order.number, changed: false };
      }

      await tx.payment.update({ where: { id: paymentId }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
      await tx.subOrder.updateMany({ where: { orderId: payment.orderId }, data: { status: 'PAID' } });

      // Consume las reservas: el stock reservado sale del inventario (venta firme).
      const reservations = await tx.stockReservation.findMany({
        where: { orderId: payment.orderId },
        include: { variant: { select: { productId: true } } },
      });
      for (const r of reservations) {
        await tx.inventory.update({ where: { variantId: r.variantId }, data: { reserved: { decrement: r.quantity } } });
        await tx.product.update({ where: { id: r.variant.productId }, data: { soldCount: { increment: r.quantity } } });
        await tx.stockReservation.delete({ where: { id: r.id } });
      }

      // Una venta por tienda involucrada.
      const subs = await tx.subOrder.findMany({ where: { orderId: payment.orderId }, select: { storeId: true } });
      for (const storeId of [...new Set(subs.map((s) => s.storeId))]) {
        await tx.store.update({ where: { id: storeId }, data: { salesCount: { increment: 1 } } });
      }

      return { orderId: payment.orderId, number: order.number, changed: true };
    });
  }

  async markUnpaid(paymentId: string, status: 'FAILED' | 'EXPIRED'): Promise<void> {
    await this.prisma.payment.update({ where: { id: paymentId }, data: { status } });
  }

  private toView(p: {
    id: string;
    orderId: string;
    method: PrismaPaymentMethod;
    status: string;
    amount: Prisma.Decimal;
    qrPayload: string | null;
    providerRef: string | null;
    expiresAt: Date | null;
  }): PaymentView {
    return {
      id: p.id,
      orderId: p.orderId,
      method: p.method as PaymentMethod,
      status: p.status,
      amount: Number(p.amount),
      qrPayload: p.qrPayload,
      providerRef: p.providerRef,
      expiresAt: p.expiresAt,
    };
  }
}
