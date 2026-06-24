export interface ProcessedMedia {
  noBgUrl: string;
  optimizedUrl: string;
  imageHash?: string | null;
}

export abstract class AIAnalysisRepository {
  abstract create(batchId: string, storeId: string, imageKey: string): Promise<{ id: string }>;
  abstract markMediaDone(id: string, media: ProcessedMedia): Promise<void>;
  abstract markFailed(id: string, error: string): Promise<void>;
}
