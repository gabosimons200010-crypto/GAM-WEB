import { ForbiddenException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { ProductStatus } from '../../domain/product';

export interface ListMyProductsInput {
  userId: string;
  storeId: string;
  status?: ProductStatus;
  lowStock?: boolean;
  cursor?: string;
  limit: number;
}

/** Lista los productos de una tienda; soporta filtro de stock bajo (RF-SHOP-005). */
@Injectable()
export class ListMyProductsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(input: ListMyProductsInput) {
    if (!(await this.stores.userOwnsStore(input.userId, input.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    const settings = await this.stores.getSettings(input.storeId);
    return this.products.listByStore({
      storeId: input.storeId,
      status: input.status,
      lowStock: input.lowStock,
      lowStockThreshold: settings?.lowStockThreshold ?? 5,
      cursor: input.cursor,
      limit: input.limit,
    });
  }
}
