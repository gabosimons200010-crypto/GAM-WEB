import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { ListDuplicatesUseCase } from '../application/use-cases/list-duplicates.use-case';
import { ResolveDuplicateUseCase } from '../application/use-cases/resolve-duplicate.use-case';
import { ResolveDuplicateDto } from './dto/duplicate.dto';

@ApiTags('seller · IA duplicados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
@Controller('seller/stores/:storeId/ai/duplicates')
export class AiDuplicatesController {
  constructor(
    private readonly listDuplicates: ListDuplicatesUseCase,
    private readonly resolveDuplicate: ResolveDuplicateUseCase,
  ) {}

  /** Borradores marcados como posibles duplicados (IA-005). */
  @Get()
  list(@CurrentUser() user: AuthUser, @Param('storeId') storeId: string) {
    return this.listDuplicates.execute(user.sub, storeId);
  }

  /** Resuelve un duplicado: merge | update_stock | ignore. */
  @Post(':analysisId/resolve')
  resolve(
    @CurrentUser() user: AuthUser,
    @Param('analysisId') analysisId: string,
    @Body() dto: ResolveDuplicateDto,
  ) {
    return this.resolveDuplicate.execute({
      userId: user.sub,
      analysisId,
      action: dto.action,
      stock: dto.stock,
    });
  }
}
