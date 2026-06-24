export interface VisionJob {
  analysisId: string;
  batchId: string;
  storeId: string;
}

/** Productor de jobs de visión (cola "ai"). Lo dispara el worker de media. */
export abstract class VisionJobQueue {
  abstract enqueue(job: VisionJob): Promise<void>;
}
