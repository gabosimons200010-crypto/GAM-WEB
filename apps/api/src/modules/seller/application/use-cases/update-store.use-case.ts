import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository, UpdateStoreData } from '../ports/store.repository';
import { StoreView } from '../../domain/store';

/**
 * Actualiza el perfil de la tienda (logo, banner, descripción, redes,
 * categorías). Exige que el usuario sea dueño de la tienda (RF-AUTH-006).
 */
@Injectable()
export class UpdateStoreUseCase {
  constructor(private readonly stores: StoreRepository) {}

  async execute(userId: string, storeId: string, data: UpdateStoreData): Promise<StoreView> {
    await this.assertOwner(userId, storeId);
    return this.stores.update(storeId, data);
  }

  private async assertOwner(userId: string, storeId: string): Promise<void> {
    const exists = await this.stores.findById(storeId);
    if (!exists) {
      throw new NotFoundException('Tienda no encontrada');
    }
    if (!(await this.stores.userOwnsStore(userId, storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
  }
}
