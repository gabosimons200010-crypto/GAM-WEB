import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/interface/guards/roles.guard';
import { Roles } from '../../identity/interface/decorators/roles.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { CreateBatchUseCase } from '../application/use-cases/create-batch.use-case';
import { GetBatchStatusUseCase } from '../application/use-cases/get-batch-status.use-case';
import { CreateBatchDto } from './dto/ai.dto';

@ApiTags('seller · IA catalogación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.VENDEDOR, RoleName.ADMIN_TIENDA)
@Controller('seller/stores/:storeId/ai/batches')
export class AiBatchesController {
  constructor(
    private readonly createBatch: CreateBatchUseCase,
    private readonly getStatus: GetBatchStatusUseCase,
  ) {}

  /** Carga masiva (IA-003): encola el procesamiento y vuelve de inmediato. */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateBatchDto,
  ) {
    return this.createBatch.execute({ userId: user.sub, storeId, imageKeys: dto.imageKeys });
  }

  /** Estado del lote (processed/total) para la barra de progreso. */
  @Get(':batchId')
  status(@CurrentUser() user: AuthUser, @Param('batchId') batchId: string) {
    return this.getStatus.execute(user.sub, batchId);
  }
}
