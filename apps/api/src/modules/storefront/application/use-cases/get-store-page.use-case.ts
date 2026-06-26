import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { StoreView } from '../../../seller/domain/store';
import { SearchProductsUseCase } from './search-products.use-case';
import { PublicStore, SearchResult, SortOption } from '../../domain/search';

export interface StorePageInput {
  slug: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface StorePage {
  store: PublicStore;
  products: SearchResult;
}

/**
 * Página pública de una tienda (RF-MKT-002): cabecera de la tienda + su
 * catálogo activo. Solo tiendas APPROVED son visibles para compradores.
 */
@Injectable()
export class GetStorePageUseCase {
  constructor(
    private readonly stores: StoreRepository,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  async execute(input: StorePageInput): Promise<StorePage> {
    const store = await this.stores.findBySlug(input.slug);
    if (!store || store.status !== 'APPROVED') {
      throw new NotFoundException('Tienda no encontrada');
    }

    const products = await this.searchProducts.execute({
      storeId: store.id,
      sort: input.sort,
      page: input.page,
      pageSize: input.pageSize,
    });

    return { store: this.toPublic(store), products };
  }

  private toPublic(store: StoreView): PublicStore {
    return {
      id: store.id,
      slug: store.slug,
      name: store.commercialName,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      galleryId: store.galleryId,
      floor: store.floor,
      stand: store.stand,
      rating: store.rating,
      salesCount: store.salesCount,
      verified: store.verified,
    };
  }
}
