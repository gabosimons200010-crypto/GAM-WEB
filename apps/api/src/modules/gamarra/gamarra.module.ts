import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { GalleriesController } from './interface/galleries.controller';
import { GalleryRepository } from './application/ports/gallery.repository';
import { PrismaGalleryRepository } from './infrastructure/prisma-gallery.repository';
import { ListGalleriesUseCase } from './application/use-cases/list-galleries.use-case';
import { GetGalleryUseCase } from './application/use-cases/get-gallery.use-case';
import { CreateGalleryUseCase } from './application/use-cases/create-gallery.use-case';

/**
 * Bounded context GAMARRA (galerías). Implementación de referencia del patrón
 * hexagonal por módulo (ver docs/11-estructura-carpetas.md §11.2).
 * El puerto GalleryRepository se enlaza aquí a su adaptador Prisma.
 */
@Module({
  imports: [IdentityModule], // guards JWT/roles para proteger la creación
  controllers: [GalleriesController],
  providers: [
    ListGalleriesUseCase,
    GetGalleryUseCase,
    CreateGalleryUseCase,
    { provide: GalleryRepository, useClass: PrismaGalleryRepository },
  ],
})
export class GamarraModule {}
