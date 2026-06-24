import { Injectable, Logger } from '@nestjs/common';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { AIAnalysisRepository } from '../ports/ai-analysis.repository';
import { BackgroundRemover, ImageProcessor } from '../ports/image-processing';
import { VisionJobQueue } from '../ports/vision-job-queue';
import { StoragePort } from '../../../../shared/storage/storage.port';
import { MediaJob, BatchCounts } from '../../domain/ai';

const MAX_BYTES = 200 * 1024; // RNF-PERF-003: < 200 KB

/**
 * Procesa una imagen del lote (IA-004), ejecutado por el worker-media:
 * descarga el original → remoción de fondo → WebP optimizado → sube las
 * variantes → registra URLs y avanza el contador del lote. Es idempotente por
 * análisis; un fallo marca la imagen como FAILED sin tumbar el lote.
 */
@Injectable()
export class ProcessImageUseCase {
  private readonly logger = new Logger('ProcessImage');

  constructor(
    private readonly batches: AIBatchRepository,
    private readonly analyses: AIAnalysisRepository,
    private readonly storage: StoragePort,
    private readonly bgRemover: BackgroundRemover,
    private readonly images: ImageProcessor,
    private readonly visionQueue: VisionJobQueue,
  ) {}

  async execute(job: MediaJob): Promise<void> {
    try {
      const original = await this.storage.getBytes(job.imageKey);

      const noBg = await this.bgRemover.remove(original);
      const optimized = await this.images.toWebp(noBg, MAX_BYTES);
      const hash = await this.images.perceptualHash(original);

      const base = `stores/${job.storeId}/processed/${job.analysisId}`;
      const noBgRes = await this.storage.putBytes(`${base}-nobg.png`, noBg, 'image/png');
      const optRes = await this.storage.putBytes(`${base}-opt.webp`, optimized.bytes, 'image/webp');

      await this.analyses.markMediaDone(job.analysisId, {
        noBgUrl: noBgRes.publicUrl,
        optimizedUrl: optRes.publicUrl,
        imageHash: hash,
      });

      // Encadena el paso de visión (cola "ai"): el contador del lote avanza al
      // terminar la visión, no aquí, para que processed/total refleje el draft.
      await this.visionQueue.enqueue({
        analysisId: job.analysisId,
        batchId: job.batchId,
        storeId: job.storeId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Fallo procesando imagen ${job.analysisId}: ${message}`);
      await this.analyses.markFailed(job.analysisId, message);
      const counts = await this.batches.incrementFailed(job.batchId);
      await this.maybeFinish(job.batchId, counts);
    }
  }

  private async maybeFinish(batchId: string, counts: BatchCounts): Promise<void> {
    if (counts.processed + counts.failed < counts.total) return;
    const status = counts.failed === 0 ? 'DONE' : counts.processed === 0 ? 'FAILED' : 'PARTIAL';
    await this.batches.setStatus(batchId, status);
  }
}
