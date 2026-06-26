import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ListMyOrdersUseCase } from '../application/use-cases/list-my-orders.use-case';
import { GetMyOrderUseCase } from '../application/use-cases/get-my-order.use-case';
import { PageQueryDto } from './dto/orders.dto';

/** Órdenes del comprador (RF-MKT-007). Cada quien ve solo las suyas. */
@ApiTags('órdenes (comprador)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly listMine: ListMyOrdersUseCase,
    private readonly getMine: GetMyOrderUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Mis órdenes, más recientes primero (paginado por cursor).' })
  list(@CurrentUser() user: AuthUser, @Query() query: PageQueryDto) {
    return this.listMine.execute(user.sub, query.cursor, query.limit);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle de una de mis órdenes.' })
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getMine.execute(user.sub, id);
  }
}
