import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderQueryRepository } from '../ports/order-query.repository';
import { OrderView } from '../../domain/order-view';

/** Detalle de una orden del comprador (RF-MKT-007). Solo si es suya. */
@Injectable()
export class GetMyOrderUseCase {
  constructor(private readonly orders: OrderQueryRepository) {}

  async execute(userId: string, orderId: string): Promise<OrderView> {
    const order = await this.orders.findForUser(orderId, userId);
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    return order;
  }
}
