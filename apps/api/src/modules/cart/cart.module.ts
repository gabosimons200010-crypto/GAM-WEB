import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';

import { CartController } from './interface/cart.controller';
import { CartRepository } from './application/ports/cart.repository';
import { PrismaCartRepository } from './infrastructure/prisma-cart.repository';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { AddItemUseCase } from './application/use-cases/add-item.use-case';
import { UpdateItemUseCase } from './application/use-cases/update-item.use-case';
import { RemoveItemUseCase } from './application/use-cases/remove-item.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';

/**
 * Bounded context CART (Sprint 8, Fase 2): carrito multi-tienda del comprador.
 * Importa IdentityModule por JwtAuthGuard. Lee precios/stock vivos vía Prisma.
 * Exporta CartRepository para que el Checkout (Sprint 9) consuma el carrito.
 */
@Module({
  imports: [IdentityModule],
  controllers: [CartController],
  providers: [
    { provide: CartRepository, useClass: PrismaCartRepository },
    GetCartUseCase,
    AddItemUseCase,
    UpdateItemUseCase,
    RemoveItemUseCase,
    ClearCartUseCase,
  ],
  exports: [CartRepository],
})
export class CartModule {}
