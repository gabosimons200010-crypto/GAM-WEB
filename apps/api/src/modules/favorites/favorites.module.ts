import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { FavoritesController } from './interface/favorites.controller';
import { FavoritesRepository } from './application/ports/favorites.repository';
import { PrismaFavoritesRepository } from './infrastructure/prisma-favorites.repository';

/** Bounded context FAVORITES: lista de deseos del comprador. */
@Module({
  imports: [IdentityModule],
  controllers: [FavoritesController],
  providers: [{ provide: FavoritesRepository, useClass: PrismaFavoritesRepository }],
})
export class FavoritesModule {}
