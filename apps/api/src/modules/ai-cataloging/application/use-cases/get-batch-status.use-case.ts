import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AIBatchRepository } from '../ports/ai-batch.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { AIBatchView } from '../../domain/ai';

/** Estado del lote: processed/total para barra de progreso (IA-003). */
@Injectable()
export class GetBatchStatusUseCase {
  constructor(
    private readonly batches: AIBatchRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(userId: string, batchId: string): Promise<AIBatchView> {
    const batch = await this.batches.findById(batchId);
    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }
    if (!(await this.stores.userOwnsStore(userId, batch.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    return batch;
  }
}
