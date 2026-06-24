import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { OutboxPublisher } from '../../../../shared/events/outbox';
import { ProductView } from '../../domain/product';
import { requireOwnedProduct } from './product-ownership';

/**
 * Publica un borrador (human-in-the-loop, IA-001..002). El vendedor revisa,
 * fija precio y publica. Si la tienda está verificada pasa a ACTIVE; si no, va
 * a IN_REVIEW (cola de moderación del admin, RF-ADM-002). Exige precio > 0.
 */
@Injectable()
export class PublishProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(userId: string, productId: string): Promise<ProductView> {
    const product = await requireOwnedProduct(this.products, this.stores, userId, productId);

    if (product.price <= 0) {
      throw new BadRequestException('Define un precio mayor a 0 antes de publicar');
    }
    if (!product.variants.length) {
      throw new BadRequestException('El producto necesita al menos una variante');
    }

    const store = await this.stores.findById(product.storeId);
    const target = store?.verified ? 'ACTIVE' : 'IN_REVIEW';
    await this.products.setStatus(productId, target);

    await this.outbox.publish({
      aggregate: 'Product',
      aggregateId: productId,
      type: target === 'ACTIVE' ? 'ProductPublished' : 'ProductSubmittedForReview',
      payload: { storeId: product.storeId, productId, status: target },
    });

    return { ...product, status: target };
  }
}
