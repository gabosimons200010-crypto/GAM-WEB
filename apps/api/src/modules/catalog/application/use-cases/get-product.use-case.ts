import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import { ProductView } from '../../domain/product';

/** Detalle público de producto por slug (RF-CAT-003). Solo productos ACTIVE. */
@Injectable()
export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(slug: string): Promise<ProductView> {
    const product = await this.products.findActiveBySlug(slug);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }
}
