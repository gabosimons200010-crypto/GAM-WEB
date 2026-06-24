import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../ports/product.repository';
import {
  Gender,
  MediaKind,
  ProductView,
  generateProductSku,
  variantSku,
} from '../../domain/product';
import { slugify } from '../../../seller/domain/store';

export interface DraftMedia {
  url: string;
  kind: MediaKind;
}

export interface CreateProductDraftInput {
  storeId: string;
  name: string;
  description?: string | null;
  gender?: Gender | null;
  categoryId?: string | null;
  attributes?: Record<string, unknown> | null;
  tags?: string[];
  media?: DraftMedia[];
}

/**
 * Crea un producto en estado DRAFT a partir del análisis de IA (IA-001/002).
 * Lo invoca el worker de visión. Precio 0 y una variante por defecto: el
 * vendedor completa precio/variantes y publica (human-in-the-loop).
 * Expuesto por CatalogModule para que AI Cataloging no escriba sus tablas.
 */
@Injectable()
export class CreateProductDraftUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: CreateProductDraftInput): Promise<ProductView> {
    const slug = await this.uniqueSlug(input.name);
    const sku = generateProductSku(slug);

    const product = await this.products.create({
      storeId: input.storeId,
      slug,
      sku,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      gender: input.gender ?? null,
      price: 0, // el vendedor lo define antes de publicar
      salePrice: null,
      tags: input.tags ?? [],
      attributes: input.attributes ?? null,
      variants: [
        { sku: variantSku(sku, null, null, 0), size: null, color: null, colorHex: null, price: null, stock: 0 },
      ],
    });

    for (const [i, m] of (input.media ?? []).entries()) {
      await this.products.addMedia(product.id, { kind: m.kind, url: m.url, position: i });
    }

    return product;
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
