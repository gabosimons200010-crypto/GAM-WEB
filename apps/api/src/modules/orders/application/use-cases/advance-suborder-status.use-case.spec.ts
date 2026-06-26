import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdvanceSubOrderStatusUseCase } from './advance-suborder-status.use-case';
import { OrderQueryRepository, SubOrderRef } from '../ports/order-query.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { SellerSubOrderView } from '../../domain/order-view';
import { SubOrderStatus } from '../../domain/suborder-status';

class FakeOrders extends OrderQueryRepository {
  public advancedTo?: SubOrderStatus;
  public trackingCode?: string | null;
  constructor(private readonly ref: SubOrderRef | null) {
    super();
  }
  async getSubOrderRef() {
    return this.ref;
  }
  async advanceStatus(_id: string, to: SubOrderStatus, _by: string, _note: string | null, tracking: string | null) {
    this.advancedTo = to;
    this.trackingCode = tracking;
    return { id: 'so1', status: to } as unknown as SellerSubOrderView;
  }
  listByUser(): never {
    throw new Error('n/a');
  }
  findForUser(): never {
    throw new Error('n/a');
  }
  listForStores(): never {
    throw new Error('n/a');
  }
}

class FakeStores extends StoreRepository {
  constructor(private readonly owns: boolean) {
    super();
  }
  async userOwnsStore() {
    return this.owns;
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

const REF: SubOrderRef = { id: 'so1', storeId: 's1', status: 'PAID' };

describe('AdvanceSubOrderStatusUseCase', () => {
  it('avanza cuando el usuario es dueño y la transición es válida', async () => {
    const orders = new FakeOrders(REF);
    await new AdvanceSubOrderStatusUseCase(orders, new FakeStores(true)).execute({
      userId: 'u1',
      subOrderId: 'so1',
      to: 'PREPARING',
      trackingCode: 'TRK1',
    });
    expect(orders.advancedTo).toBe('PREPARING');
    expect(orders.trackingCode).toBe('TRK1');
  });

  it('404 si la suborden no existe', async () => {
    await expect(
      new AdvanceSubOrderStatusUseCase(new FakeOrders(null), new FakeStores(true)).execute({ userId: 'u1', subOrderId: 'x', to: 'PREPARING' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 si el usuario no administra la tienda', async () => {
    await expect(
      new AdvanceSubOrderStatusUseCase(new FakeOrders(REF), new FakeStores(false)).execute({ userId: 'u2', subOrderId: 'so1', to: 'PREPARING' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('400 ante transición inválida', async () => {
    await expect(
      new AdvanceSubOrderStatusUseCase(new FakeOrders(REF), new FakeStores(true)).execute({ userId: 'u1', subOrderId: 'so1', to: 'DELIVERED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
