export interface UploadUrlRequest {
  storeId: string;
  contentType: string;
  ext: string;
}

export interface UploadUrlResult {
  uploadUrl: string; // URL prefirmada para PUT directo
  key: string; // clave del objeto
  publicUrl: string; // URL pública (CDN) una vez subido
  expiresIn: number; // segundos
}

export interface PutResult {
  key: string;
  publicUrl: string;
}

/**
 * Puerto de almacenamiento de objetos (S3 / R2 / MinIO). Compartido por Catalog
 * (subida directa del cliente) y AI Cataloging (procesamiento server-side de
 * imágenes). La validación de tipo real y tamaño es parte del contrato
 * (RNF-SEC-007).
 */
export abstract class StoragePort {
  /** URL prefirmada para que el cliente suba directo (no pasa por el API). */
  abstract createUploadUrl(req: UploadUrlRequest): Promise<UploadUrlResult>;
  /** Descarga el contenido de un objeto por su clave (uso server-side). */
  abstract getBytes(key: string): Promise<Buffer>;
  /** Sube bytes generados en el servidor (variantes procesadas). */
  abstract putBytes(key: string, bytes: Buffer, contentType: string): Promise<PutResult>;
  /** URL pública (CDN) para una clave ya existente. */
  abstract publicUrl(key: string): string;
}
