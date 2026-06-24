import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ImportProductsUseCase } from '../application/use-cases/import-products.use-case';
import { ImportProductsDto } from './dto/import.dto';

@ApiTags('seller · importación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
@Controller('seller/stores/:storeId/import')
export class SellerImportController {
  constructor(private readonly importProducts: ImportProductsUseCase) {}

  /** Valida las filas sin crear nada (IA-007: muestra errores antes de confirmar). */
  @Post('validate')
  @HttpCode(200)
  validate(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Body() dto: ImportProductsDto,
  ) {
    return this.importProducts.execute({ userId: user.sub, storeId, rows: dto.rows, dryRun: true });
  }

  /** Importa: crea borradores para las filas válidas y reporta las erróneas. */
  @Post()
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Body() dto: ImportProductsDto,
  ) {
    return this.importProducts.execute({ userId: user.sub, storeId, rows: dto.rows });
  }
}
