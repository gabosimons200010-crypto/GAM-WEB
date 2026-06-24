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

export interface HashedProduct {
  productId: string;
  imageHash: string;
}

export interface DuplicateSuggestion {
  analysisId: string;
  productId: string; // borrador nuevo
  duplicateOfProductId: string; // producto existente
}

export abstract class AIAnalysisRepository {
  abstract create(batchId: string, storeId: string, imageKey: string): Promise<{ id: string }>;
  abstract get(id: string): Promise<AnalysisRecord | null>;
  abstract markMediaDone(id: string, media: ProcessedMedia): Promise<void>;
  abstract saveVision(id: string, data: VisionSave): Promise<void>;
  abstract markFailed(id: string, error: string): Promise<void>;
  // IA-005: deduplicación.
  abstract getImageHash(analysisId: string): Promise<string | null>;
  abstract findHashedProducts(storeId: string, excludeProductId: string): Promise<HashedProduct[]>;
  abstract setDuplicateOf(analysisId: string, productId: string): Promise<void>;
  abstract listDuplicateSuggestions(storeId: string): Promise<DuplicateSuggestion[]>;
  abstract clearDuplicate(analysisId: string): Promise<void>;
  abstract getSuggestion(analysisId: string): Promise<DuplicateSuggestion | null>;
}
