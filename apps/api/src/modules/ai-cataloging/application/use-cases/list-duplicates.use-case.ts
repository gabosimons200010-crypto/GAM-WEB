import { ForbiddenException, Injectable } from '@nestjs/common';
import { AIAnalysisRepository, DuplicateSuggestion } from '../ports/ai-analysis.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';

/** Lista los borradores marcados como posibles duplicados (IA-005). */
@Injectable()
export class ListDuplicatesUseCase {
  constructor(
    private readonly analyses: AIAnalysisRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(userId: string, storeId: string): Promise<DuplicateSuggestion[]> {
    if (!(await this.stores.userOwnsStore(userId, storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    return this.analyses.listDuplicateSuggestions(storeId);
  }
}
