import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { StoragePort, UploadUrlResult } from '../../../../shared/storage/storage.port';
import { StoreRepository } from '../../../seller/application/ports/store.repository';

// RNF-SEC-007: solo se aceptan imágenes; el tipo real se revalida al procesar.
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class RequestUploadUrlUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly stores: StoreRepository,
  ) {}

  async execute(userId: string, storeId: string, contentType: string): Promise<UploadUrlResult> {
    if (!(await this.stores.userOwnsStore(userId, storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    const ext = ALLOWED[contentType];
    if (!ext) {
      throw new BadRequestException('Formato no permitido (usa JPG, PNG o WebP)');
    }
    return this.storage.createUploadUrl({ storeId, contentType, ext });
  }
}
