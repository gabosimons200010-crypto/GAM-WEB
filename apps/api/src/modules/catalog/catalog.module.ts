import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SellerModule } from '../seller/seller.module';

import { SellerProductsController } from './interface/seller-products.controller';
import { SellerImportController } from './interface/seller-import.controller';
import { ProductsController } from './interface/products.controller';
import { CategoriesController } from './interface/categories.controller';

import { ProductRepository } from './application/ports/product.repository';
import { CategoryRepository } from './application/ports/category.repository';
import { ImportJobRepository } from './application/ports/import-job.repository';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { PrismaImportJobRepository } from './infrastructure/prisma-import-job.repository';

import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { CreateProductDraftUseCase } from './application/use-cases/create-product-draft.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ArchiveProductUseCase } from './application/use-cases/archive-product.use-case';
import { PauseProductUseCase } from './application/use-cases/pause-product.use-case';
import { ManageProductMediaUseCase } from './application/use-cases/manage-product-media.use-case';
import { PublishProductUseCase } from './application/use-cases/publish-product.use-case';
import { ListMyProductsUseCase } from './application/use-cases/list-my-products.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { AdjustInventoryUseCase } from './application/use-cases/adjust-inventory.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { RequestUploadUrlUseCase } from './application/use-cases/request-upload-url.use-case';
import { ImportProductsUseCase } from './application/use-cases/import-products.use-case';
import { ProductModerationActions } from './application/use-cases/product-moderation.use-case';

/**
 * Bounded context CATALOG (productos, variantes, inventario, categorías, media).
 * Sprint 3. Importa SellerModule para verificar propiedad de tienda
 * (StoreRepository exportado) sin tocar sus tablas. Base de la IA de
 * catalogación (Sprints 4-6) y del marketplace (Fase 2).
 */
@Module({
  imports: [IdentityModule, SellerModule],
  controllers: [
    SellerProductsController,
    SellerImportController,
    ProductsController,
    CategoriesController,
  ],
  providers: [
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    { provide: ImportJobRepository, useClass: PrismaImportJobRepository },
    // StoragePort lo provee StorageModule (global).
    CreateProductUseCase,
    CreateProductDraftUseCase,
    UpdateProductUseCase,
    ArchiveProductUseCase,
    PauseProductUseCase,
    ManageProductMediaUseCase,
    PublishProductUseCase,
    ListMyProductsUseCase,
    GetProductUseCase,
    AdjustInventoryUseCase,
    ListCategoriesUseCase,
    RequestUploadUrlUseCase,
    ImportProductsUseCase,
    ProductModerationActions,
  ],
  // Exporta lo que AI Cataloging y Admin necesitan (Sprints 5-6).
  exports: [ProductRepository, CategoryRepository, CreateProductDraftUseCase, ProductModerationActions],
})
export class CatalogModule {}
