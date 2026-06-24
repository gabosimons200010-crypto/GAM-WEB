import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SellerModule } from '../seller/seller.module';

import { SellerProductsController } from './interface/seller-products.controller';
import { ProductsController } from './interface/products.controller';
import { CategoriesController } from './interface/categories.controller';

import { ProductRepository } from './application/ports/product.repository';
import { CategoryRepository } from './application/ports/category.repository';
import { StoragePort } from './application/ports/storage.port';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { S3StorageAdapter } from './infrastructure/s3-storage.adapter';

import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ArchiveProductUseCase } from './application/use-cases/archive-product.use-case';
import { ListMyProductsUseCase } from './application/use-cases/list-my-products.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { AdjustInventoryUseCase } from './application/use-cases/adjust-inventory.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { RequestUploadUrlUseCase } from './application/use-cases/request-upload-url.use-case';

/**
 * Bounded context CATALOG (productos, variantes, inventario, categorías, media).
 * Sprint 3. Importa SellerModule para verificar propiedad de tienda
 * (StoreRepository exportado) sin tocar sus tablas. Base de la IA de
 * catalogación (Sprints 4-6) y del marketplace (Fase 2).
 */
@Module({
  imports: [IdentityModule, SellerModule],
  controllers: [SellerProductsController, ProductsController, CategoriesController],
  providers: [
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    { provide: StoragePort, useClass: S3StorageAdapter },
    CreateProductUseCase,
    UpdateProductUseCase,
    ArchiveProductUseCase,
    ListMyProductsUseCase,
    GetProductUseCase,
    AdjustInventoryUseCase,
    ListCategoriesUseCase,
    RequestUploadUrlUseCase,
  ],
  exports: [ProductRepository],
})
export class CatalogModule {}
