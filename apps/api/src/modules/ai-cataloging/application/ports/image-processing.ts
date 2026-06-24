/**
 * Remoción de fondo (IA-004). NO la hace el LLM de visión (ADR-06): se usa un
 * modelo/servicio especializado. La implementación por defecto es un
 * passthrough (devuelve la imagen tal cual) hasta conectar Bria/BiRefNet.
 */
export abstract class BackgroundRemover {
  abstract remove(input: Buffer): Promise<Buffer>;
}

export interface OptimizedImage {
  bytes: Buffer;
  width: number;
  height: number;
  contentType: string;
}

/**
 * Procesamiento de imagen con sharp: optimización a WebP < 200KB (RNF-PERF-003)
 * y hash perceptual para deduplicación (IA-005, se usará en Sprint 6).
 */
export abstract class ImageProcessor {
  abstract toWebp(input: Buffer, maxBytes: number): Promise<OptimizedImage>;
  abstract perceptualHash(input: Buffer): Promise<string>;
}
