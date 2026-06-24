export interface ProcessedMedia {
  noBgUrl: string;
  optimizedUrl: string;
  imageHash?: string | null;
}

export interface AnalysisRecord {
  id: string;
  storeId: string;
  imageKey: string;
  optimizedUrl: string | null;
  noBgUrl: string | null;
}

export interface VisionSave {
  provider: string;
  model: string;
  confidence: number;
  result: Record<string, unknown>;
  costUsd: number;
  productId: string;
  lowConfidence: boolean;
}

export abstract class AIAnalysisRepository {
  abstract create(batchId: string, storeId: string, imageKey: string): Promise<{ id: string }>;
  abstract get(id: string): Promise<AnalysisRecord | null>;
  abstract markMediaDone(id: string, media: ProcessedMedia): Promise<void>;
  abstract saveVision(id: string, data: VisionSave): Promise<void>;
  abstract markFailed(id: string, error: string): Promise<void>;
}
