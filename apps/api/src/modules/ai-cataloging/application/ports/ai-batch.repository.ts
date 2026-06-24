import { AIBatchStatus, AIBatchView, BatchCounts } from '../../domain/ai';

export abstract class AIBatchRepository {
  abstract create(storeId: string, total: number, source: string): Promise<AIBatchView>;
  abstract findById(id: string): Promise<AIBatchView | null>;
  abstract setStatus(id: string, status: AIBatchStatus): Promise<void>;
  /** Incrementa procesados y devuelve los contadores actualizados (atómico). */
  abstract incrementProcessed(id: string): Promise<BatchCounts>;
  abstract incrementFailed(id: string): Promise<BatchCounts>;
}
