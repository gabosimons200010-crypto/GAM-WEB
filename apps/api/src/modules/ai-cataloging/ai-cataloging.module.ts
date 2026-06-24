import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IdentityModule } from '../identity/identity.module';
import { SellerModule } from '../seller/seller.module';
import { AiSharedModule } from './ai-shared.module';
import { AiBatchesController } from './interface/ai-batches.controller';
import { MediaJobQueue } from './application/ports/media-job-queue';
import { BullMediaJobQueue } from './infrastructure/bull-media-job-queue';
import { CreateBatchUseCase } from './application/use-cases/create-batch.use-case';
import { GetBatchStatusUseCase } from './application/use-cases/get-batch-status.use-case';
import { QUEUE_MEDIA } from '../../shared/queue/queue.constants';

/**
 * Lado API del contexto AI Cataloging (Sprint 4): crea lotes y encola jobs
 * (productor). El procesamiento real vive en AiWorkerModule (proceso worker).
 */
@Module({
  imports: [
    IdentityModule,
    SellerModule, // StoreRepository (propiedad de tienda)
    AiSharedModule,
    BullModule.registerQueue({ name: QUEUE_MEDIA }),
  ],
  controllers: [AiBatchesController],
  providers: [
    { provide: MediaJobQueue, useClass: BullMediaJobQueue },
    CreateBatchUseCase,
    GetBatchStatusUseCase,
  ],
})
export class AiCatalogingModule {}
