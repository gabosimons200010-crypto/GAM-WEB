import { Injectable } from '@nestjs/common';
import { OrderQueryRepository, Page } from '../ports/order-query.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { SellerSubOrderView } from '../../domain/order-view';
import { SubOrderStatus } from '../../domain/suborder-status';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ListStoreOrdersInput {
  userId: string;
  status?: SubOrderStatus;
  cursor?: string;
  limit?: number;
}

/**
 * Cola de pedidos del vendedor (RF-MKT-007): subórdenes de todas las tiendas
 * que administra, opcionalmente filtradas por estado.
 */
@Injectable()
export class ListStoreOrdersUseCase {
  constructor(
    private readonly orders: OrderQueryRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(input: ListStoreOrdersInput): Promise<Page<SellerSubOrderView>> {
    const owned = await this.stores.findByOwner(input.userId);
    if (owned.length === 0) {
      return { items: [], nextCursor: null };
    }
    const take = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(input.limit ?? DEFAULT_LIMIT)));
    return this.orders.listForStores(
      owned.map((s) => s.id),
      input.status,
      input.cursor,
      take,
    );
  }
}
