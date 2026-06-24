import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository, UpdateSettingsData } from '../ports/store.repository';
import { StoreSettingsView } from '../../domain/store';

/**
 * Configuración de la tienda (RF-SHOP-010): horario, días de preparación,
 * política de devoluciones, umbral de stock bajo. Solo el dueño.
 */
@Injectable()
export class UpdateStoreSettingsUseCase {
  constructor(private readonly stores: StoreRepository) {}

  async execute(
    userId: string,
    storeId: string,
    data: UpdateSettingsData,
  ): Promise<StoreSettingsView> {
    const store = await this.stores.findById(storeId);
    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }
    if (!(await this.stores.userOwnsStore(userId, storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    return this.stores.upsertSettings(storeId, data);
  }
}
