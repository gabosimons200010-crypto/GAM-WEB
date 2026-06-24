import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Gallery } from '../domain/gallery.entity';
import { ListGalleriesUseCase } from '../application/use-cases/list-galleries.use-case';
import { GetGalleryUseCase } from '../application/use-cases/get-gallery.use-case';
import { CreateGalleryUseCase } from '../application/use-cases/create-gallery.use-case';
import { CreateGalleryDto } from './dto/create-gallery.dto';

@ApiTags('galerías')
@Controller('galleries')
export class GalleriesController {
  constructor(
    private readonly listGalleries: ListGalleriesUseCase,
    private readonly getGallery: GetGalleryUseCase,
    private readonly createGallery: CreateGalleryUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista de galerías de Gamarra.' })
  list(): Promise<Gallery[]> {
    return this.listGalleries.execute();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una galería.' })
  get(@Param('id') id: string): Promise<Gallery> {
    return this.getGallery.execute(id);
  }

  // TODO(auth): restringir a ADMIN/SUPER_ADMIN cuando esté el módulo Identity (Sprint 1).
  @Post()
  @ApiCreatedResponse({ description: 'Galería creada.' })
  create(@Body() dto: CreateGalleryDto): Promise<Gallery> {
    return this.createGallery.execute(dto);
  }
}
