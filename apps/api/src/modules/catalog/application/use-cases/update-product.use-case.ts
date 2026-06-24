import { Injectable } from '@nestjs/common';
import { ProductRepository, UpdateProductData } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { ProductView } from '../../domain/product';
import { requireOwnedProduct } from './product-ownership';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(userId: string, productId: string, data: UpdateProductData): Promise<ProductView> {
    await requireOwnedProduct(this.products, this.stores, userId, productId);
    return this.products.updateScalars(productId, data);
  }
}
