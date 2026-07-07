import { Injectable } from '@nestjs/common';
import { OrderQueryRepository } from '../ports/order-query.repository';
import { OrderView } from '../../domain/order-view';

/**
 * Cancelación de pedido por el comprador (RF-MKT-008). Solo mientras no salió;
 * repone el stock reservado. La validación de estado vive en el repositorio
 * (transacción).
 */
@Injectable()
export class CancelMyOrderUseCase {
  constructor(private readonly orders: OrderQueryRepository) {}

  execute(userId: string, orderId: string): Promise<OrderView> {
    return this.orders.cancelByUser(orderId, userId);
  }
}
