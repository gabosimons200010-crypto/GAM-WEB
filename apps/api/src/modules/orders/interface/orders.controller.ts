import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { Public } from '../../identity/interface/decorators/public.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ListMyOrdersUseCase } from '../application/use-cases/list-my-orders.use-case';
import { GetMyOrderUseCase } from '../application/use-cases/get-my-order.use-case';
import { TrackOrderUseCase } from '../application/use-cases/track-order.use-case';
import { CancelMyOrderUseCase } from '../application/use-cases/cancel-my-order.use-case';
import { PageQueryDto, TrackOrderDto } from './dto/orders.dto';

/** Órdenes del comprador (RF-MKT-007). Cada quien ve solo las suyas. */
@ApiTags('órdenes (comprador)')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly listMine: ListMyOrdersUseCase,
    private readonly getMine: GetMyOrderUseCase,
    private readonly trackOrder: TrackOrderUseCase,
    private readonly cancelMine: CancelMyOrderUseCase,
  ) {}

  /** Rastreo público por número + correo (invitado o comprador, sin sesión). */
  @Post('track')
  @Public()
  @ApiOkResponse({ description: 'Estado de un pedido consultado por número + correo.' })
  track(@Body() dto: TrackOrderDto) {
    return this.trackOrder.execute(dto.number, dto.email);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Mis órdenes, más recientes primero (paginado por cursor).' })
  list(@CurrentUser() user: AuthUser, @Query() query: PageQueryDto) {
    return this.listMine.execute(user.sub, query.cursor, query.limit);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Detalle de una de mis órdenes.' })
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getMine.execute(user.sub, id);
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'Cancela el pedido (si aún no salió) y repone el stock.' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cancelMine.execute(user.sub, id);
  }
}
