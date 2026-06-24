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
import { RoleName } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ProductModerationActions } from '../../catalog/application/use-cases/product-moderation.use-case';
import { ReasonDto } from '../../seller/interface/dto/store.dto';

/**
 * Cola de moderación de productos (RF-ADM-002). Solo ADMIN/SUPER_ADMIN.
 * Los productos en IN_REVIEW (tiendas no verificadas) se aprueban o rechazan.
 */
@ApiTags('admin · moderación de productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
@Controller('admin/products/moderation')
export class AdminProductsController {
  constructor(private readonly moderation: ProductModerationActions) {}

  @Get()
  list(
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.moderation.list(cursor, Math.min(limit, 100));
  }

  @Post(':productId/approve')
  approve(@CurrentUser() admin: AuthUser, @Param('productId') productId: string, @Req() req: Request) {
    return this.moderation.approve(productId, { adminId: admin.sub, ip: req.ip });
  }

  @Post(':productId/reject')
  reject(
    @CurrentUser() admin: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: ReasonDto,
    @Req() req: Request,
  ) {
    return this.moderation.reject(productId, { adminId: admin.sub, ip: req.ip, reason: dto.reason });
  }
}
