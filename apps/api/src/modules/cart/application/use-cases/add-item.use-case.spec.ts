import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AddItemUseCase } from './add-item.use-case';
import { CartRepository, PurchasableVariant } from '../ports/cart.repository';
import { RawCartLine } from '../../domain/cart';

class FakeCart extends CartRepository {
  public added: { variantId: string; quantity: number }[] = [];
  constructor(
    private readonly variant: PurchasableVariant | null,
    private readonly existingQty = 0,
  ) {
    super();
  }
  async getOrCreateForUser() {
    return 'cart1';
  }
  async getLines(): Promise<RawCartLine[]> {
    if (this.existingQty === 0) return [];
    return [
      {
        variantId: 'v1',
        productId: 'p1',
        productSlug: 's',
        productName: 'n',
        productStatus: 'ACTIVE',
        storeId: 's1',
        storeName: 'A',
        storeSlug: 'a',
        storeStatus: 'APPROVED',
        size: null,
        color: null,
        variantPrice: null,
        productPrice: 10,
        productSalePrice: null,
        available: this.variant?.available ?? 0,
        quantity: this.existingQty,
        thumbnailUrl: null,
      },
    ];
  }
  async getPurchasable() {
    return this.variant;
  }
  async addOrIncrement(_c: string, variantId: string, quantity: number) {
    this.added.push({ variantId, quantity });
  }
  async setQuantity() {}
  async hasItem() {
    return this.existingQty > 0;
  }
  async removeItem() {}
  async clear() {}
}

const OK: PurchasableVariant = { variantId: 'v1', productStatus: 'ACTIVE', storeStatus: 'APPROVED', available: 10 };

describe('AddItemUseCase', () => {
  it('agrega cuando hay stock y el producto es comprable', async () => {
    const repo = new FakeCart(OK);
    const res = await new AddItemUseCase(repo).execute({ userId: 'u1', variantId: 'v1', quantity: 2 });
    expect(repo.added).toEqual([{ variantId: 'v1', quantity: 2 }]);
    expect(res.itemCount).toBe(0); // getLines devuelve vacío en este fake (no es el foco)
  });

  it('rechaza variante inexistente con 404', async () => {
    await expect(new AddItemUseCase(new FakeCart(null)).execute({ userId: 'u1', variantId: 'x', quantity: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rechaza si el producto no está disponible (no ACTIVE/APPROVED)', async () => {
    const variant: PurchasableVariant = { ...OK, productStatus: 'PAUSED' };
    await expect(new AddItemUseCase(new FakeCart(variant)).execute({ userId: 'u1', variantId: 'v1', quantity: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza si la cantidad total supera el stock', async () => {
    const variant: PurchasableVariant = { ...OK, available: 3 };
    await expect(new AddItemUseCase(new FakeCart(variant)).execute({ userId: 'u1', variantId: 'v1', quantity: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('suma la cantidad ya presente al validar el stock', async () => {
    // Stock 10, ya hay 8 en el carrito, intenta agregar 5 → 13 > 10 → rechaza.
    const variant: PurchasableVariant = { ...OK, available: 10 };
    await expect(new AddItemUseCase(new FakeCart(variant, 8)).execute({ userId: 'u1', variantId: 'v1', quantity: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rechaza cantidades no positivas', async () => {
    await expect(new AddItemUseCase(new FakeCart(OK)).execute({ userId: 'u1', variantId: 'v1', quantity: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
