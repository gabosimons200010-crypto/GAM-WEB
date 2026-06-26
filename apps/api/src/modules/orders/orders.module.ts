import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { SellerModule } from '../seller/seller.module';

import { OrdersController } from './interface/orders.controller';
import { SellerOrdersController } from './interface/seller-orders.controller';
import { OrderQueryRepository } from './application/ports/order-query.repository';
import { PrismaOrderQueryRepository } from './infrastructure/prisma-order-query.repository';
import { ListMyOrdersUseCase } from './application/use-cases/list-my-orders.use-case';
import { GetMyOrderUseCase } from './application/use-cases/get-my-order.use-case';
import { ListStoreOrdersUseCase } from './application/use-cases/list-store-orders.use-case';
import { AdvanceSubOrderStatusUseCase } from './application/use-cases/advance-suborder-status.use-case';

/**
 * Bounded context ORDERS (Sprint 11, Fase 2): consulta del comprador y gestión
 * de pedidos del vendedor (postventa). Importa SellerModule (StoreRepository)
 * para validar propiedad de tienda e IdentityModule por JwtAuthGuard.
 */
@Module({
  imports: [IdentityModule, SellerModule],
  controllers: [OrdersController, SellerOrdersController],
  providers: [
    { provide: OrderQueryRepository, useClass: PrismaOrderQueryRepository },
    ListMyOrdersUseCase,
    GetMyOrderUseCase,
    ListStoreOrdersUseCase,
    AdvanceSubOrderStatusUseCase,
  ],
})
export class OrdersModule {}
