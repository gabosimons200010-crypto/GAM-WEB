import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { AIAnalysisRepository } from '../ports/ai-analysis.repository';
import { MediaJobQueue } from '../ports/media-job-queue';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { AIBatchView } from '../../domain/ai';

const MAX_IMAGES = 500; // IA-003: hasta 500 fotos por carga

export interface CreateBatchInput {
  userId: string;
  storeId: string;
  imageKeys: string[];
}

/**
 * Carga masiva de imágenes (IA-003). Crea el lote y un análisis por imagen, y
 * encola un job de procesamiento por cada una. Todo el trabajo pesado ocurre en
 * segundo plano (RNF-ESC-003): la respuesta vuelve de inmediato.
 */
@Injectable()
export class CreateBatchUseCase {
  constructor(
    private readonly batches: AIBatchRepository,
    private readonly analyses: AIAnalysisRepository,
    private readonly queue: MediaJobQueue,
    private readonly stores: StoreRepository,
  ) {}

  async execute(input: CreateBatchInput): Promise<AIBatchView> {
    if (!(await this.stores.userOwnsStore(input.userId, input.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    const keys = input.imageKeys ?? [];
    if (keys.length < 1 || keys.length > MAX_IMAGES) {
      throw new BadRequestException(`Sube entre 1 y ${MAX_IMAGES} imágenes`);
    }

    const batch = await this.batches.create(input.storeId, keys.length, 'upload');

    for (const imageKey of keys) {
      const analysis = await this.analyses.create(batch.id, input.storeId, imageKey);
      await this.queue.enqueue({
        analysisId: analysis.id,
        batchId: batch.id,
        storeId: input.storeId,
        imageKey,
      });
    }

    await this.batches.setStatus(batch.id, 'PROCESSING');
    return { ...batch, status: 'PROCESSING' };
  }
}
