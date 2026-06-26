import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SellerModule } from '../seller/seller.module';

import { StorefrontController } from './interface/storefront.controller';
import { CatalogSearchPort } from './application/ports/catalog-search.port';
import { PrismaCatalogSearchRepository } from './infrastructure/prisma-catalog-search.repository';
import { SearchProductsUseCase } from './application/use-cases/search-products.use-case';
import { GetStorePageUseCase } from './application/use-cases/get-store-page.use-case';

/**
 * Bounded context STOREFRONT (Sprint 7, Fase 2): la vitrina del comprador.
 * Lado de lectura del catálogo — búsqueda, filtros y página de tienda.
 * Importa CatalogModule (CategoryRepository) y SellerModule (StoreRepository)
 * sin tocar sus tablas. El puerto CatalogSearchPort permite migrar a
 * OpenSearch más adelante sin cambiar los casos de uso.
 */
@Module({
  imports: [CatalogModule, SellerModule],
  controllers: [StorefrontController],
  providers: [
    { provide: CatalogSearchPort, useClass: PrismaCatalogSearchRepository },
    SearchProductsUseCase,
    GetStorePageUseCase,
  ],
  exports: [CatalogSearchPort, SearchProductsUseCase],
})
export class StorefrontModule {}
