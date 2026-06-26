import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SearchProductsUseCase } from './search-products.use-case';
import { CatalogSearchPort } from '../ports/catalog-search.port';
import { CategoryRepository } from '../../../catalog/application/ports/category.repository';
import { SearchFilters, SearchResult } from '../../domain/search';

class FakeSearch extends CatalogSearchPort {
  public lastFilters?: SearchFilters;
  async search(filters: SearchFilters): Promise<SearchResult> {
    this.lastFilters = filters;
    return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize, hasMore: false };
  }
}

class FakeCategories extends CategoryRepository {
  constructor(private readonly id: string | null) {
    super();
  }
  async idBySlug() {
    return this.id;
  }
  tree(): never {
    throw new Error('n/a');
  }
  exists(): never {
    throw new Error('n/a');
  }
  flat(): never {
    throw new Error('n/a');
  }
}

function build(categoryId: string | null = 'c1') {
  const search = new FakeSearch();
  const useCase = new SearchProductsUseCase(search, new FakeCategories(categoryId));
  return { search, useCase };
}

describe('SearchProductsUseCase', () => {
  it('normaliza paginación, orden por defecto y recorta el texto', async () => {
    const { search, useCase } = build();
    await useCase.execute({ query: '  polo  ' });

    expect(search.lastFilters).toMatchObject({ query: 'polo', sort: 'relevance', page: 1, pageSize: 24 });
  });

  it('limita pageSize al máximo permitido', async () => {
    const { search, useCase } = build();
    await useCase.execute({ pageSize: 999 });
    expect(search.lastFilters?.pageSize).toBe(48);
  });

  it('resuelve el slug de categoría a id', async () => {
    const { search, useCase } = build('cat-polos');
    await useCase.execute({ categorySlug: 'polos' });
    expect(search.lastFilters?.categoryId).toBe('cat-polos');
  });

  it('rechaza categoría inexistente con 404', async () => {
    const { useCase } = build(null);
    await expect(useCase.execute({ categorySlug: 'no-existe' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza rango de precio invertido', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ minPrice: 100, maxPrice: 10 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza precios negativos', async () => {
    const { useCase } = build();
    await expect(useCase.execute({ minPrice: -5 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ignora un sort inválido y cae a relevance', async () => {
    const { search, useCase } = build();
    await useCase.execute({ sort: 'whatever' as never });
    expect(search.lastFilters?.sort).toBe('relevance');
  });
});
