import { buildOrderDraft, findUnavailable, generateOrderNumber, COMMISSION_RATE } from './order';
import { RawCartLine } from '../../cart/domain/cart';

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
    storeStatus: 'APPROVED',
    size: 'M',
    color: 'Negro',
    variantPrice: null,
    productPrice: 50,
    productSalePrice: null,
    available: 10,
    quantity: 1,
    thumbnailUrl: null,
    ...over,
  };
}

describe('buildOrderDraft', () => {
  it('divide en una suborden por tienda con su subtotal y comisión', () => {
    const draft = buildOrderDraft([
      line({ storeId: 's1', productPrice: 50, quantity: 2 }), // 100
      line({ storeId: 's2', productPrice: 30, quantity: 1 }), // 30
    ]);

    expect(draft.subOrders).toHaveLength(2);
    const a = draft.subOrders.find((s) => s.storeId === 's1')!;
    expect(a.subtotal).toBe(100);
    expect(a.commission).toBe(100 * COMMISSION_RATE);
    expect(draft.subtotal).toBe(130);
    expect(draft.grandTotal).toBe(130); // envío 0, sin descuento
  });

  it('respeta el precio efectivo (variante > oferta > base)', () => {
    const draft = buildOrderDraft([line({ variantPrice: 70, productSalePrice: 40, productPrice: 50, quantity: 1 })]);
    expect(draft.subOrders[0].items[0].unitPrice).toBe(70);
    expect(draft.subtotal).toBe(70);
  });

  it('cobra envío por tienda: Lima S/10, provincia S/20, gratis desde 200', () => {
    // Lima, subtotal 100 (< 200) → S/10
    expect(buildOrderDraft([line({ productPrice: 50, quantity: 2 })], 'Lima').shippingTotal).toBe(10);
    // Provincia (Cusco), subtotal 100 → S/20
    expect(buildOrderDraft([line({ productPrice: 50, quantity: 2 })], 'Cusco').shippingTotal).toBe(20);
    // Subtotal 200 → envío gratis
    expect(buildOrderDraft([line({ productPrice: 100, quantity: 2 })], 'Lima').shippingTotal).toBe(0);
    // Sin departamento → 0 (borrador sin dirección)
    expect(buildOrderDraft([line({ productPrice: 50, quantity: 2 })]).shippingTotal).toBe(0);
  });
});

describe('findUnavailable', () => {
  it('detecta productos inactivos y sin stock', () => {
    const bad = findUnavailable([
      line({ variantId: 'ok', quantity: 1, available: 5 }),
      line({ variantId: 'inactivo', productStatus: 'PAUSED' }),
      line({ variantId: 'agotado', quantity: 9, available: 3 }),
    ]);
    expect(bad).toHaveLength(2);
    expect(bad.find((b) => b.variantId === 'inactivo')!.reason).toBe('inactivo');
    expect(bad.find((b) => b.variantId === 'agotado')!.reason).toBe('sin_stock');
  });

  it('devuelve vacío cuando todo es comprable', () => {
    expect(findUnavailable([line({ quantity: 2, available: 5 })])).toEqual([]);
  });
});

describe('generateOrderNumber', () => {
  it('tiene el formato GG-XXXXXXXX', () => {
    expect(generateOrderNumber()).toMatch(/^GG-[0-9A-F]{8}$/);
  });
});
