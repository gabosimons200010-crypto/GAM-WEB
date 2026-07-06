import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { FavoritesRepository } from '../application/ports/favorites.repository';
import { AddFavoriteDto } from './dto/favorite.dto';

/** Lista de deseos del comprador (RF-MKT-004). Requiere sesión. */
@ApiTags('favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesRepository) {}

  @Get()
  @ApiOkResponse({ description: 'Productos favoritos del usuario.' })
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.listProducts(user.sub);
  }

  @Get('ids')
  @ApiOkResponse({ description: 'Ids de producto favoritos (para pintar el corazón).' })
  ids(@CurrentUser() user: AuthUser) {
    return this.favorites.listIds(user.sub);
  }

  @Post()
  @HttpCode(201)
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddFavoriteDto) {
    await this.favorites.add(user.sub, dto.productId);
    return { ok: true };
  }

  @Delete(':productId')
  @HttpCode(200)
  async remove(@CurrentUser() user: AuthUser, @Param('productId') productId: string) {
    await this.favorites.remove(user.sub, productId);
    return { ok: true };
  }
}
