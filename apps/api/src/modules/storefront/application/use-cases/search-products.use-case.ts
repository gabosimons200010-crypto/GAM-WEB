import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogSearchPort } from '../ports/catalog-search.port';
import { CategoryRepository } from '../../../catalog/application/ports/category.repository';
import { Gender } from '../../../catalog/domain/product';
import { SearchFilters, SearchResult, SortOption, SORT_OPTIONS } from '../../domain/search';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;

export interface SearchProductsInput {
  query?: string;
  categorySlug?: string;
  gender?: Gender;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
  /** Acota a una tienda concreta (lo usa la página de tienda). */
  storeId?: string;
}

/**
 * Búsqueda y filtrado del catálogo público (RF-MKT-001). Normaliza la entrada
 * cruda (slugs → ids, clamps de paginación) y delega en el puerto de búsqueda.
 * Solo expone productos ACTIVE de tiendas APPROVED (lo garantiza el adaptador).
 */
@Injectable()
export class SearchProductsUseCase {
  constructor(
    private readonly search: CatalogSearchPort,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(input: SearchProductsInput): Promise<SearchResult> {
    const minPrice = this.nonNegative(input.minPrice, 'minPrice');
    const maxPrice = this.nonNegative(input.maxPrice, 'maxPrice');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new BadRequestException('minPrice no puede ser mayor que maxPrice');
    }

    let categoryId: string | undefined;
    if (input.categorySlug) {
      const resolved = await this.categories.idBySlug(input.categorySlug);
      if (!resolved) {
        throw new NotFoundException('Categoría no encontrada');
      }
      categoryId = resolved;
    }

    const query = input.query?.trim();
    const sort: SortOption = input.sort && SORT_OPTIONS.includes(input.sort) ? input.sort : 'relevance';
    const page = Math.max(1, Math.trunc(input.page ?? 1));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)));

    const filters: SearchFilters = {
      query: query && query.length > 0 ? query : undefined,
      categoryId,
      gender: input.gender,
      storeId: input.storeId,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize,
    };

    return this.search.search(filters);
  }

  private nonNegative(value: number | undefined, field: string): number | undefined {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${field} debe ser un número >= 0`);
    }
    return value;
  }
}
