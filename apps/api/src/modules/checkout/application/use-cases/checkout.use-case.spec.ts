import { BadRequestException, ConflictException } from '@nestjs/common';
import { CheckoutUseCase } from './checkout.use-case';
import { CartRepository } from '../../../cart/application/ports/cart.repository';
import { OrderRepository, PlaceOrderData, OrderSummaryView } from '../ports/order.repository';
import { RawCartLine } from '../../../cart/domain/cart';

function line(over: Partial<RawCartLine>): RawCartLine {
  return {
    variantId: 'v1',
    productId: 'p1',
    productSlug: 's',
    productName: 'Polo',
    productStatus: 'ACTIVE',
    storeId: 's1',
    storeName: 'Tienda A',
    storeSlug: 'a',
    size: 'M',
    color: 'Negro',
    storeStatus: 'APPROVED',
    variantPrice: null,
    productPrice: 50,
    productSalePrice: null,
    available: 10,
    quantity: 1,
    thumbnailUrl: null,
    ...over,
  };
}

class FakeCart extends CartRepository {
  public cleared = false;
  constructor(private readonly lines: RawCartLine[]) {
    super();
  }
  async getOrCreateForUser() {
    return 'cart1';
  }
  async getLines() {
    return this.lines;
  }
  async clear() {
    this.cleared = true;
  }
  getPurchasable(): never {
    throw new Error('n/a');
  }
  addOrIncrement(): never {
    throw new Error('n/a');
  }
  setQuantity(): never {
    throw new Error('n/a');
  }
  hasItem(): never {
    throw new Error('n/a');
  }
  removeItem(): never {
    throw new Error('n/a');
  }
}

class FakeOrders extends OrderRepository {
  public received?: PlaceOrderData;
  async placeOrder(data: PlaceOrderData): Promise<OrderSummaryView> {
    this.received = data;
    return {
      id: 'o1',
      number: 'GG-ABCD1234',
      status: 'PENDING_PAYMENT',
      subtotal: data.draft.subtotal,
      shippingTotal: data.draft.shippingTotal,
      discountTotal: data.draft.discountTotal,
      grandTotal: data.draft.grandTotal,
      createdAt: new Date(),
      subOrders: [],
    };
  }
}

const ADDRESS = { department: 'Lima', province: 'Lima', district: 'La Victoria', line: 'Jr. Gamarra 123' };

describe('CheckoutUseCase', () => {
  it('crea la orden con el draft del carrito y luego vacía el carrito', async () => {
    const cart = new FakeCart([line({ storeId: 's1', productPrice: 50, quantity: 2 })]);
    const orders = new FakeOrders();
    const res = await new CheckoutUseCase(cart, orders).execute({ userId: 'u1', address: ADDRESS, buyer: {} });

    expect(orders.received?.draft.grandTotal).toBe(100);
    expect(orders.received?.reservationExpiresAt).toBeInstanceOf(Date);
    expect(res.status).toBe('PENDING_PAYMENT');
    expect(cart.cleared).toBe(true);
  });

  it('rechaza el carrito vacío', async () => {
    const orders = new FakeOrders();
    await expect(
      new CheckoutUseCase(new FakeCart([]), orders).execute({ userId: 'u1', address: ADDRESS, buyer: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orders.received).toBeUndefined();
  });

  it('rechaza si hay líneas no disponibles y no crea la orden', async () => {
    const cart = new FakeCart([line({ variantId: 'agotado', quantity: 9, available: 2 })]);
    const orders = new FakeOrders();
    await expect(
      new CheckoutUseCase(cart, orders).execute({ userId: 'u1', address: ADDRESS, buyer: {} }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(orders.received).toBeUndefined();
    expect(cart.cleared).toBe(false);
  });
});
