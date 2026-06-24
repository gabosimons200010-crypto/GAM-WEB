import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { RegisterStoreUseCase } from '../application/use-cases/register-store.use-case';
import { ListMyStoresUseCase } from '../application/use-cases/list-my-stores.use-case';
import { UpdateStoreUseCase } from '../application/use-cases/update-store.use-case';
import { UpdateStoreSettingsUseCase } from '../application/use-cases/update-store-settings.use-case';
import { RegisterStoreDto, UpdateStoreDto, UpdateStoreSettingsDto } from './dto/store.dto';

@ApiTags('seller · tiendas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seller/stores')
export class SellerStoresController {
  constructor(
    private readonly registerStore: RegisterStoreUseCase,
    private readonly listMyStores: ListMyStoresUseCase,
    private readonly updateStore: UpdateStoreUseCase,
    private readonly updateSettings: UpdateStoreSettingsUseCase,
  ) {}

  /** Registro de tienda en 3 pasos (RF-SHOP-001). Cualquier usuario autenticado. */
  @Post()
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterStoreDto, @Req() req: Request) {
    return this.registerStore.execute({ ownerUserId: user.sub, ip: req.ip, ...dto });
  }

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.listMyStores.execute(user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.updateStore.execute(user.sub, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
  @Patch(':id/settings')
  settings(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.updateSettings.execute(user.sub, id, dto);
  }
}
