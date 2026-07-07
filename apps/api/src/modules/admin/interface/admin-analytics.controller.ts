import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { SalesByStyleUseCase } from '../application/sales-by-style.use-case';

/** Analítica de tendencias de la plataforma (RF-ADM). Solo ADMIN/SUPER_ADMIN. */
@ApiTags('admin · analítica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly salesByStyle: SalesByStyleUseCase) {}

  @Get('sales-by-style')
  @ApiOkResponse({ description: 'Ventas por estilo/look, base para forecasting.' })
  getSalesByStyle() {
    return this.salesByStyle.execute();
  }
}
