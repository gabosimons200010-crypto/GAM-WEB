import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SellerModule } from '../seller/seller.module';
import { AdminStoresController } from './interface/admin-stores.controller';

/**
 * Bounded context ADMIN / PLATFORM. Sprint 2: gestión y moderación de tiendas.
 * Orquesta acciones del agregado Store reutilizando AdminStoreActions que
 * exporta el contexto Seller (no accede a sus tablas directamente).
 * En sprints siguientes crecerá con moderación de productos, banners,
 * cupones globales, finanzas y logs.
 */
@Module({
  imports: [IdentityModule, SellerModule],
  controllers: [AdminStoresController],
})
export class AdminModule {}
