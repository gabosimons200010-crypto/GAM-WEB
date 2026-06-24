import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiSharedModule } from './ai-shared.module';
import { ProcessImageUseCase } from './application/use-cases/process-image.use-case';
import { BackgroundRemover, ImageProcessor } from './application/ports/image-processing';
import { NoopBackgroundRemover } from './infrastructure/noop-background-remover';
import { SharpImageProcessor } from './infrastructure/sharp-image-processor';
import { MediaProcessor } from './infrastructure/media.processor';
import { QUEUE_MEDIA } from '../../shared/queue/queue.constants';

/**
 * Lado worker del contexto AI Cataloging (worker-media). Consume la cola
 * "media" y procesa imágenes (IA-004). Se carga solo en el proceso worker
 * (workers/worker.module.ts), no en el API.
 */
@Module({
  imports: [AiSharedModule, BullModule.registerQueue({ name: QUEUE_MEDIA })],
  providers: [
    ProcessImageUseCase,
    { provide: BackgroundRemover, useClass: NoopBackgroundRemover },
    { provide: ImageProcessor, useClass: SharpImageProcessor },
    MediaProcessor,
  ],
})
export class AiWorkerModule {}
