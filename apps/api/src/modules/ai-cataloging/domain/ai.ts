export type AIBatchStatus = 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'PARTIAL' | 'DONE' | 'FAILED';

export interface AIBatchView {
  id: string;
  storeId: string;
  status: AIBatchStatus;
  total: number;
  processed: number;
  failed: number;
  source: string;
  createdAt: Date;
}

export interface BatchCounts {
  total: number;
  processed: number;
  failed: number;
}

/** Payload del job de procesamiento de imagen (cola "media", IA-004). */
export interface MediaJob {
  analysisId: string;
  batchId: string;
  storeId: string;
  imageKey: string;
}
