import { NotFoundException } from '@nestjs/common';
import { GetStorePageUseCase } from './get-store-page.use-case';
import { SearchProductsUseCase, SearchProductsInput } from './search-products.use-case';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { StoreView } from '../../../seller/domain/store';
import { SearchResult } from '../../domain/search';

const APPROVED: StoreView = {
  id: 's1',
  slug: 'moda-lima',
  commercialName: 'Moda Lima',
  legalName: 'Moda Lima SAC',
  ruc: '20123456789',
  contactName: 'Ana Torres',
  email: 'ventas@modalima.pe',
  phone: '999888777',
  galleryId: 'g1',
  floor: '2',
  stand: 'A-15',
  address: 'Jr. Gamarra 123',
  logoUrl: 'https://cdn/logo.png',
  bannerUrl: null,
  description: 'Ropa urbana',
  status: 'APPROVED',
  verified: true,
  rating: 4.5,
  salesCount: 120,
  createdAt: new Date(),
  socials: [],
  categoryIds: ['c1'],
};

class FakeStores extends StoreRepository {
  constructor(private readonly store: StoreView | null) {
    super();
  }
  async findBySlug() {
    return this.store;
  }
  slugExists(): never {
    throw new Error('n/a');
  }
  register(): never {
    throw new Error('n/a');
  }
  findById(): never {
    throw new Error('n/a');
  }
  findByOwner(): never {
    throw new Error('n/a');
  }
  userOwnsStore(): never {
    throw new Error('n/a');
  }
  update(): never {
    throw new Error('n/a');
  }
  getSettings(): never {
    throw new Error('n/a');
  }
  upsertSettings(): never {
    throw new Error('n/a');
  }
  setStatus(): never {
    throw new Error('n/a');
  }
  setVerified(): never {
    throw new Error('n/a');
  }
  list(): never {
    throw new Error('n/a');
  }
}

const EMPTY: SearchResult = { items: [], total: 0, page: 1, pageSize: 24, hasMore: false };

class FakeSearch {
  public lastInput?: SearchProductsInput;
  async execute(input: SearchProductsInput): Promise<SearchResult> {
    this.lastInput = input;
    return EMPTY;
  }
}

function build(store: StoreView | null) {
  const search = new FakeSearch();
  const useCase = new GetStorePageUseCase(new FakeStores(store), search as unknown as SearchProductsUseCase);
  return { useCase, search };
}

describe('GetStorePageUseCase', () => {
  it('devuelve la tienda pública (sin datos sensibles) y delega el catálogo acotado a la tienda', async () => {
    const { useCase, search } = build(APPROVED);

    const page = await useCase.execute({ slug: 'moda-lima', page: 2, sort: 'newest' });

    // Proyección pública: expone nombre comercial, oculta RUC/email/razón social.
    expect(page.store).toMatchObject({ id: 's1', slug: 'moda-lima', name: 'Moda Lima', verified: true });
    expect(page.store as unknown as Record<string, unknown>).not.toHaveProperty('ruc');
    expect(page.store as unknown as Record<string, unknown>).not.toHaveProperty('email');
    // Delegó la búsqueda acotada a la tienda con la paginación recibida.
    expect(search.lastInput).toMatchObject({ storeId: 's1', page: 2, sort: 'newest' });
    expect(page.products).toBe(EMPTY);
  });

  it('responde 404 cuando la tienda no existe', async () => {
    const { useCase } = build(null);
    await expect(useCase.execute({ slug: 'fantasma' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('responde 404 cuando la tienda no está APPROVED (no visible al comprador)', async () => {
    const { useCase } = build({ ...APPROVED, status: 'IN_REVIEW' });
    await expect(useCase.execute({ slug: 'moda-lima' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
