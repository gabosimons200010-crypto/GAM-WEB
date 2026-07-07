import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ProductRepository, NewVariant } from '../ports/product.repository';
import { CategoryRepository } from '../ports/category.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import {
  Gender,
  ProductView,
  generateProductSku,
  variantSku,
} from '../../domain/product';
import { slugify } from '../../../seller/domain/store';

export interface CreateVariantInput {
  size?: string;
  color?: string;
  colorHex?: string;
  price?: number;
  stock: number;
}

export interface CreateProductInput {
  ownerUserId: string;
  storeId: string;
  name: string;
  description?: string;
  categoryId?: string;
  gender?: Gender;
  price: number;
  salePrice?: number;
  tags?: string[];
  imageUrls?: string[];
  variants: CreateVariantInput[];
}

/**
 * Alta de producto con variantes talla/color e inventario (RF-SHOP-003).
 * Crea en estado DRAFT, genera SKU por producto y variante (IA-006). Solo el
 * dueño de la tienda (RF-AUTH-006).
 */
@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<ProductView> {
    if (!(await this.stores.userOwnsStore(input.ownerUserId, input.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    if (!input.variants.length) {
      throw new BadRequestException('El producto necesita al menos una variante');
    }
    if (input.categoryId && !(await this.categories.exists(input.categoryId))) {
      throw new BadRequestException('Categoría inválida');
    }

    const slug = await this.uniqueSlug(input.name);
    const productSku = generateProductSku(slug);

    const variants: NewVariant[] = input.variants.map((v, i) => ({
      sku: variantSku(productSku, v.size ?? null, v.color ?? null, i),
      size: v.size ?? null,
      color: v.color ?? null,
      colorHex: v.colorHex ?? null,
      price: v.price ?? null,
      stock: v.stock,
    }));

    return this.products.create({
      storeId: input.storeId,
      slug,
      sku: productSku,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      gender: input.gender ?? null,
      price: input.price,
      salePrice: input.salePrice ?? null,
      tags: input.tags ?? [],
      imageUrls: input.imageUrls ?? [],
      variants,
    });
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'producto';
    let candidate = base;
    let n = 1;
    while (await this.products.slugExists(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }
}
