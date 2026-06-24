import { Injectable, Logger } from '@nestjs/common';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { AIAnalysisRepository } from '../ports/ai-analysis.repository';
import { VisionPort } from '../ports/vision.port';
import { StoragePort } from '../../../../shared/storage/storage.port';
import { OutboxPublisher } from '../../../../shared/events/outbox';
import { CategoryRepository } from '../../../catalog/application/ports/category.repository';
import { CreateProductDraftUseCase } from '../../../catalog/application/use-cases/create-product-draft.use-case';
import { VisionJob } from '../ports/vision-job-queue';
import { BatchCounts } from '../../domain/ai';

const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Paso de visión (IA-001/002), ejecutado por el worker-ai: analiza la imagen
 * optimizada con el VisionPort, crea un Producto en DRAFT (vía Catalog),
 * registra el resultado y emite AIDraftReady. Avanza el contador del lote.
 */
@Injectable()
export class AnalyzeImageUseCase {
  private readonly logger = new Logger('AnalyzeImage');

  constructor(
    private readonly batches: AIBatchRepository,
    private readonly analyses: AIAnalysisRepository,
    private readonly vision: VisionPort,
    private readonly storage: StoragePort,
    private readonly categories: CategoryRepository,
    private readonly createDraft: CreateProductDraftUseCase,
    private readonly outbox: OutboxPublisher,
  ) {}

  async execute(job: VisionJob): Promise<void> {
    try {
      const analysis = await this.analyses.get(job.analysisId);
      if (!analysis?.optimizedUrl) {
        throw new Error('La imagen no fue procesada por el paso de media');
      }

      const bytes = await this.storage.getBytes(analysis.optimizedUrl);
      const taxonomy = await this.categories.flat();
      const result = await this.vision.analyze({
        imageBytes: bytes,
        contentType: 'image/webp',
        categories: taxonomy,
      });

      // Crea el borrador con la media ya procesada (IA-004).
      const media = [
        { url: analysis.optimizedUrl, kind: 'OPTIMIZED' as const },
        ...(analysis.noBgUrl ? [{ url: analysis.noBgUrl, kind: 'NO_BACKGROUND' as const }] : []),
        { url: analysis.imageKey, kind: 'ORIGINAL' as const },
      ];
      const draft = await this.createDraft.execute({
        storeId: analysis.storeId,
        name: result.name,
        description: result.description,
        gender: result.attributes.gender,
        categoryId: result.categoryId,
        attributes: { ...result.attributes },
        tags: result.tags,
        media,
      });

      await this.analyses.saveVision(job.analysisId, {
        provider: result.provider,
        model: result.model,
        confidence: result.confidence,
        result: { ...result },
        costUsd: result.costUsd,
        productId: draft.id,
        lowConfidence: result.confidence < CONFIDENCE_THRESHOLD,
      });

      await this.outbox.publish({
        aggregate: 'Product',
        aggregateId: draft.id,
        type: 'AIDraftReady',
        payload: {
          storeId: analysis.storeId,
          analysisId: job.analysisId,
          productId: draft.id,
          confidence: result.confidence,
        },
      });

      const counts = await this.batches.incrementProcessed(job.batchId);
      await this.maybeFinish(job.batchId, counts);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Fallo en visión de ${job.analysisId}: ${message}`);
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
