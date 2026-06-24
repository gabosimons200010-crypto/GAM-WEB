import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository } from '../ports/store.repository';
import { StoreView } from '../../domain/store';

/**
 * Perfil público de tienda por slug (RF-CAT-006). Solo expone tiendas
 * aprobadas; los borradores/en revisión no son visibles públicamente.
 */
@Injectable()
export class GetStoreProfileUseCase {
  constructor(private readonly stores: StoreRepository) {}

  async execute(slug: string): Promise<StoreView> {
    const store = await this.stores.findBySlug(slug);
    if (!store || store.status !== 'APPROVED') {
      throw new NotFoundException('Tienda no encontrada');
    }
    return store;
  }
}
