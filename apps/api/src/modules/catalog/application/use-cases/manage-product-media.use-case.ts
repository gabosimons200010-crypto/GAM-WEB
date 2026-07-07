import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { requireOwnedProduct } from './product-ownership';

/** Agregar/quitar fotos de un producto ya creado (RF-SHOP-003). Exige propiedad. */
@Injectable()
export class ManageProductMediaUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
  ) {}

  async add(userId: string, productId: string, url: string): Promise<void> {
    const product = await requireOwnedProduct(this.products, this.stores, userId, productId);
    if (product.media.length >= 8) {
      throw new BadRequestException('Máximo 8 fotos por producto');
    }
    await this.products.addMedia(productId, { kind: 'ORIGINAL', url, position: product.media.length });
  }

  async remove(userId: string, productId: string, mediaId: string): Promise<void> {
    await requireOwnedProduct(this.products, this.stores, userId, productId);
    await this.products.deleteMedia(productId, mediaId);
  }
}
