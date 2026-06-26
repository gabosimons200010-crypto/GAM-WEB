import { Injectable } from '@nestjs/common';
import { OrderQueryRepository, Page } from '../ports/order-query.repository';
import { OrderView } from '../../domain/order-view';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Lista las órdenes del comprador autenticado (RF-MKT-007). */
@Injectable()
export class ListMyOrdersUseCase {
  constructor(private readonly orders: OrderQueryRepository) {}

  execute(userId: string, cursor?: string, limit?: number): Promise<Page<OrderView>> {
    const take = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_LIMIT)));
    return this.orders.listByUser(userId, cursor, take);
  }
}
