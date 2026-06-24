import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyzeImageUseCase } from '../application/use-cases/analyze-image.use-case';
import { VisionJob } from '../application/ports/vision-job-queue';
import { QUEUE_AI } from '../../../shared/queue/queue.constants';

/**
 * Consumidor de la cola "ai" (worker-ai): visión + generación de contenido y
 * creación del borrador. Concurrencia baja por defecto para respetar los
 * límites de cuota del proveedor (free tier de Gemini); el back-off lo maneja
 * BullMQ ante errores 429.
 */
@Processor(QUEUE_AI, { concurrency: 2 })
export class VisionProcessor extends WorkerHost {
  constructor(private readonly analyzeImage: AnalyzeImageUseCase) {
    super();
  }

  async process(job: Job<VisionJob>): Promise<void> {
    await this.analyzeImage.execute(job.data);
  }
}
