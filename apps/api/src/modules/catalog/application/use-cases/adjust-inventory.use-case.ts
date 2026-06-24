import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { OutboxPublisher } from '../../../../shared/events/outbox';

export interface AdjustInventoryInput {
  userId: string;
  variantId: string;
  available: number;
}

/**
 * Ajusta el stock disponible de una variante (RF-SHOP-005). Si queda por debajo
 * del umbral de la tienda, emite el evento StockLow (vía outbox) que un worker
 * de notificaciones consumirá en un sprint posterior.
 */
@Injectable()
export class AdjustInventoryUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(input: AdjustInventoryInput): Promise<{ variantId: string; available: number; lowStock: boolean }> {
    const ctx = await this.products.getVariantContext(input.variantId);
    if (!ctx) {
      throw new NotFoundException('Variante no encontrada');
    }
    if (!(await this.stores.userOwnsStore(input.userId, ctx.storeId))) {
      throw new ForbiddenException('No administras este producto');
    }

    await this.products.setVariantAvailable(input.variantId, input.available);

    const settings = await this.stores.getSettings(ctx.storeId);
    const threshold = settings?.lowStockThreshold ?? 5;
    const lowStock = input.available <= threshold;

    if (lowStock) {
      await this.outbox.publish({
        aggregate: 'Product',
        aggregateId: ctx.productId,
        type: 'StockLow',
        payload: {
          storeId: ctx.storeId,
          productId: ctx.productId,
          variantId: input.variantId,
          available: input.available,
          threshold,
        },
      });
    }

    return { variantId: input.variantId, available: input.available, lowStock };
  }
}
