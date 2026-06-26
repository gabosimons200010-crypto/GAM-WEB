import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CartModule } from '../cart/cart.module';

import { CheckoutController } from './interface/checkout.controller';
import { OrderRepository } from './application/ports/order.repository';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { CheckoutUseCase } from './application/use-cases/checkout.use-case';

/**
 * Bounded context CHECKOUT (Sprint 9, Fase 2): convierte el carrito en orden.
 * Importa CartModule (CartRepository) para leer/vaciar el carrito e
 * IdentityModule por JwtAuthGuard. Crea Order + SubOrders + reservas de stock
 * en una transacción. Exporta OrderRepository para Pagos (Sprint 10).
 */
@Module({
  imports: [IdentityModule, CartModule],
  controllers: [CheckoutController],
  providers: [
    { provide: OrderRepository, useClass: PrismaOrderRepository },
    CheckoutUseCase,
  ],
  exports: [OrderRepository],
})
export class CheckoutModule {}
