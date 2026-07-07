import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuditModule } from './shared/audit/audit.module';
import { OutboxModule } from './shared/events/outbox.module';
import { StorageModule } from './shared/storage/storage.module';
import { QueueModule } from './shared/queue/queue.module';
import { HealthModule } from './shared/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { GamarraModule } from './modules/gamarra/gamarra.module';
import { SellerModule } from './modules/seller/seller.module';
import { AdminModule } from './modules/admin/admin.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AiCatalogingModule } from './modules/ai-cataloging/ai-cataloging.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouponsModule } from './modules/coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Rate limiting global por defecto; endpoints sensibles lo endurecen con
    // @Throttle (login 5/min, registro 3/h…) — RNF-SEC-006.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    OutboxModule,
    StorageModule,
    QueueModule,
    HealthModule,
    // Bounded contexts (se añaden por sprint):
    IdentityModule, // Sprint 1
    GamarraModule,
    SellerModule, // Sprint 2
    AdminModule, // Sprint 2
    CatalogModule, // Sprint 3
    AiCatalogingModule, // Sprint 4 (productor; el worker es un proceso aparte)
    // Sprint 5: visión + copy (cola "ai")
    StorefrontModule, // Sprint 7 (Fase 2): vitrina del comprador — búsqueda + tiendas
    CartModule, // Sprint 8 (Fase 2): carrito multi-tienda
    CheckoutModule, // Sprint 9 (Fase 2): checkout — carrito → orden + reserva de stock
    PaymentModule, // Sprint 10 (Fase 2): pagos (Yape/Plin QR + webhook) → orden PAID
    OrdersModule, // Sprint 11 (Fase 2): órdenes (comprador) + postventa (vendedor)
    FavoritesModule, // Fase 2+: lista de deseos del comprador
    ReviewsModule, // Fase 2+: reseñas y calificación de productos
    CouponsModule, // Fase 2+: cupones de descuento
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
