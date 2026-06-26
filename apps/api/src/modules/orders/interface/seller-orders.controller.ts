import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ListStoreOrdersUseCase } from '../application/use-cases/list-store-orders.use-case';
import { AdvanceSubOrderStatusUseCase } from '../application/use-cases/advance-suborder-status.use-case';
import { AdvanceStatusDto, StoreOrdersQueryDto } from './dto/orders.dto';
import { SubOrderStatus } from '../domain/suborder-status';

/**
 * Gestión de pedidos del vendedor (RF-MKT-007): cola de subórdenes de sus
 * tiendas y avance de estado (preparar, despachar, entregar) con validación
 * de la máquina de estados y registro de historial.
 */
@ApiTags('seller · pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seller/orders')
export class SellerOrdersController {
  constructor(
    private readonly listOrders: ListStoreOrdersUseCase,
    private readonly advance: AdvanceSubOrderStatusUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Subórdenes de mis tiendas (cola de despacho), filtrable por estado.' })
  list(@CurrentUser() user: AuthUser, @Query() query: StoreOrdersQueryDto) {
    return this.listOrders.execute({
      userId: user.sub,
      status: query.status as SubOrderStatus | undefined,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Patch(':subOrderId/status')
  @ApiOkResponse({ description: 'Avanza el estado de una suborden de mi tienda.' })
  setStatus(@CurrentUser() user: AuthUser, @Param('subOrderId') subOrderId: string, @Body() dto: AdvanceStatusDto) {
    return this.advance.execute({
      userId: user.sub,
      subOrderId,
      to: dto.to as SubOrderStatus,
      note: dto.note,
      trackingCode: dto.trackingCode,
    });
  }
}
