import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './shared/prisma/prisma.module';
import { HealthModule } from './shared/health/health.module';
import { GamarraModule } from './modules/gamarra/gamarra.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    // Bounded contexts (se añaden por sprint):
    GamarraModule,
    // Sprint 1: IdentityModule
    // Sprint 2: SellerModule
    // Sprint 3: CatalogModule
    // Sprints 4-6: AiCatalogingModule
    // Fase 2: SearchModule, CartModule, OrdersModule, PaymentsModule, ...
  ],
})
export class AppModule {}
