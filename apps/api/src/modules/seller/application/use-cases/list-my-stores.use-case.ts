import { Injectable } from '@nestjs/common';
import { StoreRepository } from '../ports/store.repository';
import { StoreView } from '../../domain/store';

@Injectable()
export class ListMyStoresUseCase {
  constructor(private readonly stores: StoreRepository) {}

  execute(userId: string): Promise<StoreView[]> {
    return this.stores.findByOwner(userId);
  }
}
