import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { OrderQueryRepository, Page, SubOrderRef } from '../application/ports/order-query.repository';
import { OrderItemView, OrderView, SellerSubOrderView } from '../domain/order-view';
import { SubOrderStatus } from '../domain/suborder-status';

const orderInclude = {
  subOrders: {
    include: { items: true, store: { select: { commercialName: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.OrderInclude;

const sellerSubInclude = {
  items: true,
  order: { select: { number: true, guestName: true, address: true } },
} satisfies Prisma.SubOrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type SellerSubRow = Prisma.SubOrderGetPayload<{ include: typeof sellerSubInclude }>;

@Injectable()
export class PrismaOrderQueryRepository extends OrderQueryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listByUser(userId: string, cursor: string | undefined, limit: number): Promise<Page<OrderView>> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, limit, (r) => this.toOrderView(r));
  }

  async findForUser(orderId: string, userId: string): Promise<OrderView | null> {
    const row = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });
    return row ? this.toOrderView(row) : null;
  }

  async cancelByUser(orderId: string, userId: string): Promise<OrderView> {
    const CANCELLED = 'CANCELLED' as SubOrderStatus & Prisma.SubOrderUpdateInput['status'];
    const shippedStates = ['READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'RETURNED', 'DELIVERY_FAILED'];
    const row = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { subOrders: { include: { items: true } } },
      });
      if (!order) throw new NotFoundException('Orden no encontrada');
      if (order.status === 'CANCELLED') throw new BadRequestException('El pedido ya está cancelado');
      if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') {
        throw new BadRequestException('Este pedido no se puede cancelar');
      }
      if (order.subOrders.some((s) => shippedStates.includes(s.status))) {
        throw new BadRequestException('El pedido ya está en preparación/camino y no se puede cancelar');
      }

      // Repone el stock reservado y registra el historial.
      for (const so of order.subOrders) {
        for (const it of so.items) {
          await tx.inventory.updateMany({
            where: { variantId: it.variantId },
            data: { available: { increment: it.quantity }, reserved: { decrement: it.quantity } },
          });
        }
        await tx.orderStatusHistory.create({
          data: { subOrderId: so.id, status: CANCELLED, changedBy: userId, note: 'Cancelado por el comprador' },
        });
      }
      await tx.subOrder.updateMany({ where: { orderId }, data: { status: CANCELLED } });
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });

      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
    });
    return this.toOrderView(row);
  }

  async findByNumberAndEmail(number: string, email: string): Promise<OrderView | null> {
    // Coincide por número (único) y correo: el de invitado o el de la cuenta.
    const row = await this.prisma.order.findFirst({
      where: {
        number,
        OR: [
          { guestEmail: { equals: email, mode: 'insensitive' } },
          { user: { is: { email: { equals: email, mode: 'insensitive' } } } },
        ],
      },
      include: orderInclude,
    });
    return row ? this.toOrderView(row) : null;
  }

  async listForStores(
    storeIds: string[],
    status: SubOrderStatus | undefined,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<SellerSubOrderView>> {
    const rows = await this.prisma.subOrder.findMany({
      where: { storeId: { in: storeIds }, status: status as Prisma.EnumSubOrderStatusFilter['equals'] | undefined },
      include: sellerSubInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, limit, (r) => this.toSellerSubOrder(r));
  }

  async getSubOrderRef(subOrderId: string): Promise<SubOrderRef | null> {
    const s = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      select: { id: true, storeId: true, status: true },
    });
    return s ? { id: s.id, storeId: s.storeId, status: s.status as SubOrderStatus } : null;
  }

  async advanceStatus(
    subOrderId: string,
    to: SubOrderStatus,
    changedBy: string,
    note: string | null,
    trackingCode: string | null,
  ): Promise<SellerSubOrderView> {
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subOrder.update({
        where: { id: subOrderId },
        data: {
          status: to as Prisma.SubOrderUpdateInput['status'],
          ...(trackingCode ? { trackingCode } : {}),
        },
        include: sellerSubInclude,
      });
      await tx.orderStatusHistory.create({
        data: { subOrderId, status: to as Prisma.OrderStatusHistoryCreateInput['status'], changedBy, note },
      });
      return updated;
    });
    return this.toSellerSubOrder(row);
  }

  private paginate<R extends { id: string }, V>(rows: R[], limit: number, map: (r: R) => V): Page<V> {
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(map), nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  private toItems(items: SellerSubRow['items']): OrderItemView[] {
    return items.map((i) => ({
      variantId: i.variantId,
      productName: i.productName,
      size: i.size,
      color: i.color,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    }));
  }

  private toOrderView(row: OrderRow): OrderView {
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      subtotal: Number(row.subtotal),
      shippingTotal: Number(row.shippingTotal),
      discountTotal: Number(row.discountTotal),
      grandTotal: Number(row.grandTotal),
      createdAt: row.createdAt,
      subOrders: row.subOrders.map((s) => ({
        id: s.id,
        storeId: s.storeId,
        storeName: s.store.commercialName,
        status: s.status as SubOrderStatus,
        subtotal: Number(s.subtotal),
        shippingCost: Number(s.shippingCost),
        trackingCode: s.trackingCode,
        items: this.toItems(s.items),
      })),
    };
  }

  private toSellerSubOrder(row: SellerSubRow): SellerSubOrderView {
    const addr = row.order.address;
    return {
      id: row.id,
      orderId: row.orderId,
      orderNumber: row.order.number,
      storeId: row.storeId,
      status: row.status as SubOrderStatus,
      subtotal: Number(row.subtotal),
      shippingCost: Number(row.shippingCost),
      commission: Number(row.commission),
      trackingCode: row.trackingCode,
      createdAt: row.createdAt,
      buyerName: row.order.guestName,
      shipTo: addr
        ? {
            department: addr.department,
            province: addr.province,
            district: addr.district,
            line: addr.line,
            reference: addr.reference,
            phone: addr.phone,
          }
        : null,
      items: this.toItems(row.items),
    };
  }
}
