import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { GetCartUseCase } from '../application/use-cases/get-cart.use-case';
import { AddItemUseCase } from '../application/use-cases/add-item.use-case';
import { UpdateItemUseCase } from '../application/use-cases/update-item.use-case';
import { RemoveItemUseCase } from '../application/use-cases/remove-item.use-case';
import { ClearCartUseCase } from '../application/use-cases/clear-cart.use-case';
import { AddItemDto, UpdateItemDto } from './dto/cart.dto';

/**
 * Carrito del comprador (RF-MKT-003). Requiere sesión: cada carrito pertenece
 * a un usuario. Multi-tienda: la respuesta agrupa las líneas por tienda.
 */
@ApiTags('carrito')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(
    private readonly getCart: GetCartUseCase,
    private readonly addItem: AddItemUseCase,
    private readonly updateItem: UpdateItemUseCase,
    private readonly removeItem: RemoveItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Carrito del usuario agrupado por tienda, con totales.' })
  get(@CurrentUser() user: AuthUser) {
    return this.getCart.execute(user.sub);
  }

  @Post('items')
  @ApiOkResponse({ description: 'Agrega una variante (o suma a la existente) y devuelve el carrito.' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddItemDto) {
    return this.addItem.execute({ userId: user.sub, variantId: dto.variantId, quantity: dto.quantity });
  }

  @Patch('items/:variantId')
  @ApiOkResponse({ description: 'Fija la cantidad de una línea (0 la elimina).' })
  update(@CurrentUser() user: AuthUser, @Param('variantId') variantId: string, @Body() dto: UpdateItemDto) {
    return this.updateItem.execute({ userId: user.sub, variantId, quantity: dto.quantity });
  }

  @Delete('items/:variantId')
  @ApiOkResponse({ description: 'Elimina una línea del carrito.' })
  remove(@CurrentUser() user: AuthUser, @Param('variantId') variantId: string) {
    return this.removeItem.execute(user.sub, variantId);
  }

  @Delete()
  @HttpCode(204)
  @ApiOkResponse({ description: 'Vacía el carrito.' })
  clear(@CurrentUser() user: AuthUser) {
    return this.clearCart.execute(user.sub);
  }
}
