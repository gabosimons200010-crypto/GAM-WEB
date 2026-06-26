import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  OrderRepository,
  OrderSummaryView,
  PlaceOrderData,
  SubOrderView,
} from '../application/ports/order.repository';
import { generateOrderNumber } from '../domain/order';

@Injectable()
export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async placeOrder(data: PlaceOrderData): Promise<OrderSummaryView> {
    // Reintenta solo ante colisión del número de orden (único). El resto de
    // errores (incluida la sobreventa) se propagan sin reintentar.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.runTransaction(data, generateOrderNumber());
      } catch (e) {
        if (this.isNumberCollision(e) && attempt < 2) continue;
        throw e;
      }
    }
    throw new ConflictException('No se pudo generar la orden, intenta de nuevo');
  }

  private async runTransaction(data: PlaceOrderData, number: string): Promise<OrderSummaryView> {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          userId: data.userId,
          department: data.address.department,
          province: data.address.province,
          district: data.address.district,
          line: data.address.line,
          reference: data.address.reference ?? null,
          phone: data.address.phone ?? null,
        },
      });

      const order = await tx.order.create({
        data: {
          number,
          userId: data.userId,
          guestName: data.buyer.name ?? null,
          guestEmail: data.buyer.email ?? null,
          guestPhone: data.buyer.phone ?? null,
          buyerDni: data.buyer.dni ?? null,
          status: 'PENDING_PAYMENT',
          subtotal: data.draft.subtotal,
          shippingTotal: data.draft.shippingTotal,
          discountTotal: data.draft.discountTotal,
          grandTotal: data.draft.grandTotal,
          addressId: address.id,
        },
      });

      const subOrders: SubOrderView[] = [];
      for (const sub of data.draft.subOrders) {
        const created = await tx.subOrder.create({
          data: {
            orderId: order.id,
            storeId: sub.storeId,
            status: 'PENDING_PAYMENT',
            subtotal: sub.subtotal,
            shippingCost: sub.shippingCost,
            commission: sub.commission,
            items: {
              create: sub.items.map((i) => ({
                variantId: i.variantId,
                productName: i.productName,
                size: i.size,
                color: i.color,
                unitPrice: i.unitPrice,
                quantity: i.quantity,
              })),
            },
          },
          include: { items: true },
        });

        // Reserva atómica: descuenta de `available` solo si alcanza, y crea la
        // reserva. El updateMany condicional es el verdadero guard de sobreventa.
        for (const item of sub.items) {
          const reserved = await tx.inventory.updateMany({
            where: { variantId: item.variantId, available: { gte: item.quantity } },
            data: { available: { decrement: item.quantity }, reserved: { increment: item.quantity } },
          });
          if (reserved.count !== 1) {
            throw new ConflictException(`Stock insuficiente para ${item.productName}`);
          }
          await tx.stockReservation.create({
            data: {
              variantId: item.variantId,
              orderId: order.id,
              quantity: item.quantity,
              expiresAt: data.reservationExpiresAt,
            },
          });
        }

        subOrders.push({
          id: created.id,
          storeId: created.storeId,
          status: created.status,
          subtotal: Number(created.subtotal),
          shippingCost: Number(created.shippingCost),
          commission: Number(created.commission),
          items: created.items.map((i) => ({
            variantId: i.variantId,
            productName: i.productName,
            size: i.size,
            color: i.color,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
          })),
        });
      }

      return {
        id: order.id,
        number: order.number,
        status: order.status,
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        discountTotal: Number(order.discountTotal),
        grandTotal: Number(order.grandTotal),
        createdAt: order.createdAt,
        subOrders,
      };
    });
  }

  private isNumberCollision(e: unknown): boolean {
    return (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002' &&
      (e.meta?.target as string[] | undefined)?.includes('number') === true
    );
  }
}
