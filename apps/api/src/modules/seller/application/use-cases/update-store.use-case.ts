import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository, UpdateStoreData } from '../ports/store.repository';
import { StoreView } from '../../domain/store';

/**
 * Actualiza el perfil de la tienda (logo, banner, descripción, redes,
 * categorías y datos de empresa). Exige que el usuario sea dueño (RF-AUTH-006).
 */
@Injectable()
export class UpdateStoreUseCase {
  constructor(private readonly stores: StoreRepository) {}

  async execute(userId: string, storeId: string, data: UpdateStoreData): Promise<StoreView> {
    await this.assertOwner(userId, storeId);
    try {
      return await this.stores.update(storeId, data);
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Ya existe una tienda con ese RUC');
      }
      throw e;
    }
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
