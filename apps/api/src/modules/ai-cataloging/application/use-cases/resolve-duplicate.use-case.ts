import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AIAnalysisRepository } from '../ports/ai-analysis.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { ProductRepository } from '../../../catalog/application/ports/product.repository';

export type DuplicateAction = 'merge' | 'update_stock' | 'ignore';

export interface ResolveDuplicateInput {
  userId: string;
  analysisId: string;
  action: DuplicateAction;
  stock?: number;
}

/**
 * Resuelve una sugerencia de duplicado (IA-005) — el vendedor decide:
 * - merge: descarta el borrador nuevo (queda el existente).
 * - update_stock: suma stock a la 1ª variante del existente y descarta el nuevo.
 * - ignore: conserva ambos.
 */
@Injectable()
export class ResolveDuplicateUseCase {
  constructor(
    private readonly analyses: AIAnalysisRepository,
    private readonly stores: StoreRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: ResolveDuplicateInput): Promise<{ resolved: DuplicateAction }> {
    const analysis = await this.analyses.get(input.analysisId);
    const suggestion = await this.analyses.getSuggestion(input.analysisId);
    if (!analysis || !suggestion) {
      throw new NotFoundException('Sugerencia de duplicado no encontrada');
    }
    if (!(await this.stores.userOwnsStore(input.userId, analysis.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }

    switch (input.action) {
      case 'ignore':
        await this.analyses.clearDuplicate(input.analysisId);
        break;

      case 'merge':
        await this.products.delete(suggestion.productId); // descarta el borrador nuevo
        await this.analyses.clearDuplicate(input.analysisId);
        break;

      case 'update_stock': {
        if (input.stock === undefined || input.stock < 0) {
          throw new BadRequestException('Indica el stock a sumar');
        }
        const existing = await this.products.findById(suggestion.duplicateOfProductId);
        const variant = existing?.variants[0];
        if (variant) {
          await this.products.setVariantAvailable(variant.id, variant.available + input.stock);
        }
        await this.products.delete(suggestion.productId);
        await this.analyses.clearDuplicate(input.analysisId);
        break;
      }
    }

    return { resolved: input.action };
  }
}
