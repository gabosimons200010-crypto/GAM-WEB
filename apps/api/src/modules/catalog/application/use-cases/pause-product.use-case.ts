import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { ProductView } from '../../domain/product';
import { requireOwnedProduct } from './product-ownership';

/**
 * Pausa un producto (RF-SHOP-003): lo retira del catálogo público sin
 * archivarlo. Reversible con "publicar" (PAUSED → ACTIVE/IN_REVIEW). El
 * storefront lee status=ACTIVE directo de la BD, así que pausar lo oculta ya.
 */
@Injectable()
export class PauseProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<ProductView> {
    const product = await requireOwnedProduct(this.products, this.stores, userId, productId);
    if (product.status !== 'ACTIVE' && product.status !== 'IN_REVIEW') {
      throw new BadRequestException('Solo puedes pausar productos activos o en revisión');
    }
    await this.products.setStatus(productId, 'PAUSED');
    return { ...product, status: 'PAUSED' };
  }
}
