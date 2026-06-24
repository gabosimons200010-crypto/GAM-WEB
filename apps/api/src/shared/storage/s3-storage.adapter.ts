import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StoragePort,
  UploadUrlRequest,
  UploadUrlResult,
  PutResult,
} from './storage.port';
import type { Env } from '../../config/env.validation';

const URL_TTL = 900; // 15 min

/**
 * Adaptador de almacenamiento sobre S3/R2/MinIO. La firma de URL es local (no
 * requiere red), así que el módulo arranca sin conexión a la nube.
 */
@Injectable()
export class S3StorageAdapter extends StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    const endpoint = config.get('STORAGE_ENDPOINT', { infer: true });
    this.bucket = config.get('STORAGE_BUCKET', { infer: true });
    this.publicBase =
      config.get('STORAGE_PUBLIC_URL', { infer: true }) ??
      (endpoint ? `${endpoint}/${this.bucket}` : `https://cdn.local/${this.bucket}`);
    this.client = new S3Client({
      region: config.get('STORAGE_REGION', { infer: true }),
      endpoint,
      forcePathStyle: true, // requerido por MinIO
      credentials: {
        accessKeyId: config.get('STORAGE_ACCESS_KEY', { infer: true }) ?? 'minioadmin',
        secretAccessKey: config.get('STORAGE_SECRET_KEY', { infer: true }) ?? 'minioadmin',
      },
    });
  }

  async createUploadUrl(req: UploadUrlRequest): Promise<UploadUrlResult> {
    const key = `stores/${req.storeId}/uploads/${randomUUID()}.${req.ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: req.contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: URL_TTL });
    return { uploadUrl, key, publicUrl: this.publicUrl(key), expiresIn: URL_TTL };
  }

  async getBytes(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.stripBase(key) }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error(`Objeto vacío o inexistente: ${key}`);
    }
    return Buffer.from(bytes);
  }

  async putBytes(key: string, bytes: Buffer, contentType: string): Promise<PutResult> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: contentType }),
    );
    return { key, publicUrl: this.publicUrl(key) };
  }

  private publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  /** Acepta tanto una clave como una URL pública y devuelve la clave. */
  private stripBase(keyOrUrl: string): string {
    if (keyOrUrl.startsWith(this.publicBase)) {
      return keyOrUrl.slice(this.publicBase.length + 1);
    }
    return keyOrUrl;
  }
}
