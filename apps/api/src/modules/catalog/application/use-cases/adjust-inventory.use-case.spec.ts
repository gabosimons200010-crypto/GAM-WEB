import { AdjustInventoryUseCase } from './adjust-inventory.use-case';
import { ProductRepository } from '../ports/product.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { OutboxPublisher, DomainEvent } from '../../../../shared/events/outbox';
import { VariantContext } from '../../domain/product';

// Fakes mínimos (los métodos no usados lanzan, para detectar usos inesperados).
class FakeProducts extends ProductRepository {
  public setTo: number | null = null;
  constructor(private readonly ctx: VariantContext | null) {
    super();
  }
  async getVariantContext() {
    return this.ctx;
  }
  async setVariantAvailable(_id: string, available: number) {
    this.setTo = available;
  }
  slugExists(): never {
    throw new Error('n/a');
  }
  create(): never {
    throw new Error('n/a');
  }
  findById(): never {
    throw new Error('n/a');
  }
  findActiveBySlug(): never {
    throw new Error('n/a');
  }
  listByStore(): never {
    throw new Error('n/a');
  }
  listModeration(): never {
    throw new Error('n/a');
  }
  updateScalars(): never {
    throw new Error('n/a');
  }
  setStatus(): never {
    throw new Error('n/a');
  }
  archive(): never {
    throw new Error('n/a');
  }
  delete(): never {
    throw new Error('n/a');
  }
  addMedia(): never {
    throw new Error('n/a');
  }
  deleteMedia(): never {
    throw new Error('n/a');
  }
}

class FakeStores extends StoreRepository {
  constructor(
    private readonly owns: boolean,
    private readonly threshold: number,
  ) {
    super();
  }
  async userOwnsStore() {
    return this.owns;
  }
  async getSettings(storeId: string) {
    return { storeId, schedule: null, preparationDays: 2, returnPolicy: null, lowStockThreshold: this.threshold };
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
  findBySlug(): never {
    throw new Error('n/a');
  }
  findByOwner(): never {
    throw new Error('n/a');
  }
  update(): never {
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

class FakeOutbox extends OutboxPublisher {
  public events: DomainEvent[] = [];
  async publish(event: DomainEvent) {
    this.events.push(event);
  }
}

const CTX: VariantContext = { variantId: 'v1', productId: 'p1', storeId: 's1', available: 20 };

describe('AdjustInventoryUseCase', () => {
  it('emite StockLow cuando el stock cae a/bajo el umbral', async () => {
    const products = new FakeProducts(CTX);
    const outbox = new FakeOutbox();
    const useCase = new AdjustInventoryUseCase(products, new FakeStores(true, 5), outbox);

    const res = await useCase.execute({ userId: 'u1', variantId: 'v1', available: 3 });

    expect(products.setTo).toBe(3);
    expect(res.lowStock).toBe(true);
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0].type).toBe('StockLow');
    expect(outbox.events[0].payload).toMatchObject({ variantId: 'v1', available: 3, threshold: 5 });
  });

  it('no emite StockLow cuando el stock está por encima del umbral', async () => {
    const outbox = new FakeOutbox();
    const useCase = new AdjustInventoryUseCase(new FakeProducts(CTX), new FakeStores(true, 5), outbox);

    const res = await useCase.execute({ userId: 'u1', variantId: 'v1', available: 50 });

    expect(res.lowStock).toBe(false);
    expect(outbox.events).toHaveLength(0);
  });

  it('rechaza si el usuario no administra la tienda', async () => {
    const useCase = new AdjustInventoryUseCase(new FakeProducts(CTX), new FakeStores(false, 5), new FakeOutbox());
    await expect(useCase.execute({ userId: 'u2', variantId: 'v1', available: 1 })).rejects.toThrow();
  });
});
