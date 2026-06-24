import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName, StoreStatus } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { AdminStoreActions } from '../../seller/application/use-cases/admin-store-actions.use-case';
import { ReasonDto } from '../../seller/interface/dto/store.dto';

/**
 * Panel de administración de tiendas (RF-ADM-001). Solo ADMIN/SUPER_ADMIN.
 * Cada acción se audita (RF-ADM-006) dentro de AdminStoreActions.
 */
@ApiTags('admin · tiendas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
@Controller('admin/stores')
export class AdminStoresController {
  constructor(private readonly actions: AdminStoreActions) {}

  @Get()
  list(
    @Query('status') status?: StoreStatus,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.actions.list({ status, query: q, cursor, limit: Math.min(limit, 100) });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.actions.get(id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.actions.approve(id, { adminId: admin.sub, ip: req.ip });
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
    @Req() req: Request,
  ) {
    return this.actions.reject(id, { adminId: admin.sub, ip: req.ip, reason: dto.reason });
  }

  @Post(':id/suspend')
  suspend(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
    @Req() req: Request,
  ) {
    return this.actions.suspend(id, { adminId: admin.sub, ip: req.ip, reason: dto.reason });
  }

  @Post(':id/verify')
  verify(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.actions.verify(id, true, { adminId: admin.sub, ip: req.ip });
  }

  @Post(':id/unverify')
  unverify(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.actions.verify(id, false, { adminId: admin.sub, ip: req.ip });
  }
}
