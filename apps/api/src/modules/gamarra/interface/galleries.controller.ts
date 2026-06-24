import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
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

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiCreatedResponse({ description: 'Galería creada (solo ADMIN/SUPER_ADMIN).' })
  create(@Body() dto: CreateGalleryDto): Promise<Gallery> {
    return this.createGallery.execute(dto);
  }
}
