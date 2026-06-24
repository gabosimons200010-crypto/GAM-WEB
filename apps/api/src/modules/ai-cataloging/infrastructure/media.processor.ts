import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProcessImageUseCase } from '../application/use-cases/process-image.use-case';
import { MediaJob } from '../domain/ai';
import { QUEUE_MEDIA } from '../../../shared/queue/queue.constants';

/**
 * Consumidor de la cola "media" (worker-media). Procesa hasta `concurrency`
 * imágenes en paralelo. Se ejecuta en el proceso que cargue este módulo
 * (worker dedicado); BullMQ garantiza que cada job se procese una sola vez.
 */
@Processor(QUEUE_MEDIA, { concurrency: 4 })
export class MediaProcessor extends WorkerHost {
  constructor(private readonly processImage: ProcessImageUseCase) {
    super();
  }

  async process(job: Job<MediaJob>): Promise<void> {
    await this.processImage.execute(job.data);
  }
}
