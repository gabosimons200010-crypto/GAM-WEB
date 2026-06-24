import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { ProductView } from '../../domain/product';

/**
 * Verifica que un usuario administre la tienda dueña del producto y devuelve el
 * producto. Reutilizado por los casos de uso de edición (RF-AUTH-006).
 */
export async function requireOwnedProduct(
  products: ProductRepository,
  stores: StoreRepository,
  userId: string,
  productId: string,
): Promise<ProductView> {
  const product = await products.findById(productId);
  if (!product) {
    throw new NotFoundException('Producto no encontrado');
  }
  if (!(await stores.userOwnsStore(userId, product.storeId))) {
    throw new ForbiddenException('No administras este producto');
  }
  return product;
}
