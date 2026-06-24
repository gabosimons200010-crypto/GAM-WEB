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

/**
 * Puerto de almacenamiento de objetos (S3 / R2 / MinIO). Genera URLs
 * prefirmadas para subir imágenes directo desde el cliente, sin pasar por el
 * API. La validación de tipo real y tamaño es parte del contrato (RNF-SEC-007).
 */
export abstract class StoragePort {
  abstract createUploadUrl(req: UploadUrlRequest): Promise<UploadUrlResult>;
}
