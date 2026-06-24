import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { requireOwnedProduct } from './product-ownership';

/** Archivar / eliminar producto (RF-SHOP-003). */
@Injectable()
export class ArchiveProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
  ) {}

  async archive(userId: string, productId: string): Promise<void> {
    await requireOwnedProduct(this.products, this.stores, userId, productId);
    await this.products.archive(productId);
  }

  async remove(userId: string, productId: string): Promise<void> {
    await requireOwnedProduct(this.products, this.stores, userId, productId);
    await this.products.delete(productId);
  }
}
