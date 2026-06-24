import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './shared/prisma/prisma.module';
import { HealthModule } from './shared/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { GamarraModule } from './modules/gamarra/gamarra.module';

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
    HealthModule,
    // Bounded contexts (se añaden por sprint):
    IdentityModule, // Sprint 1
    GamarraModule,
    // Sprint 2: SellerModule
    // Sprint 3: CatalogModule
    // Sprints 4-6: AiCatalogingModule
    // Fase 2: SearchModule, CartModule, OrdersModule, PaymentsModule, ...
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
