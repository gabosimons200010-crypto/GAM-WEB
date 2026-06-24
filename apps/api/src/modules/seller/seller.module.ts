import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SellerStoresController } from './interface/seller-stores.controller';
import { StoresController } from './interface/stores.controller';
import { StoreRepository } from './application/ports/store.repository';
import { PrismaStoreRepository } from './infrastructure/prisma-store.repository';
import { RegisterStoreUseCase } from './application/use-cases/register-store.use-case';
import { ListMyStoresUseCase } from './application/use-cases/list-my-stores.use-case';
import { GetStoreProfileUseCase } from './application/use-cases/get-store-profile.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store.use-case';
import { UpdateStoreSettingsUseCase } from './application/use-cases/update-store-settings.use-case';
import { AdminStoreActions } from './application/use-cases/admin-store-actions.use-case';

/**
 * Bounded context SELLER (tiendas). Sprint 2. Es dueño del agregado Store.
 * Exporta StoreRepository y AdminStoreActions para que el contexto Admin
 * orqueste la moderación de tiendas sin acceder a sus tablas directamente.
 */
@Module({
  imports: [IdentityModule], // guards + GrantRoleUseCase
  controllers: [SellerStoresController, StoresController],
  providers: [
    { provide: StoreRepository, useClass: PrismaStoreRepository },
    RegisterStoreUseCase,
    ListMyStoresUseCase,
    GetStoreProfileUseCase,
    UpdateStoreUseCase,
    UpdateStoreSettingsUseCase,
    AdminStoreActions,
  ],
  exports: [AdminStoreActions, StoreRepository],
})
export class SellerModule {}
