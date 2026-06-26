import { assembleCart, effectiveUnitPrice, RawCartLine } from './cart';

function line(over: Partial<RawCartLine>): RawCartLine {
  return {
    variantId: 'v1',
    productId: 'p1',
    productSlug: 'polo-negro',
    productName: 'Polo negro',
    productStatus: 'ACTIVE',
    storeId: 's1',
    storeName: 'Moda Lima',
    storeSlug: 'moda-lima',
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

describe('effectiveUnitPrice', () => {
  it('prioriza el precio de la variante', () => {
    expect(effectiveUnitPrice(line({ variantPrice: 60, productSalePrice: 40, productPrice: 50 }))).toBe(60);
  });
  it('usa la oferta del producto si la variante no tiene precio', () => {
    expect(effectiveUnitPrice(line({ variantPrice: null, productSalePrice: 40, productPrice: 50 }))).toBe(40);
  });
  it('cae al precio base si no hay variante ni oferta', () => {
    expect(effectiveUnitPrice(line({ variantPrice: null, productSalePrice: null, productPrice: 50 }))).toBe(50);
  });
});

describe('assembleCart', () => {
  it('agrupa por tienda y suma subtotales y total', () => {
    const cart = assembleCart([
      line({ variantId: 'v1', storeId: 's1', storeName: 'Tienda A', productPrice: 50, quantity: 2 }),
      line({ variantId: 'v2', storeId: 's1', storeName: 'Tienda A', productPrice: 30, quantity: 1 }),
      line({ variantId: 'v3', storeId: 's2', storeName: 'Tienda B', productPrice: 20, quantity: 3 }),
    ]);

    expect(cart.groups).toHaveLength(2);
    const a = cart.groups.find((g) => g.storeId === 's1')!;
    const b = cart.groups.find((g) => g.storeId === 's2')!;
    expect(a.subtotal).toBe(130); // 50*2 + 30
    expect(b.subtotal).toBe(60); // 20*3
    expect(cart.total).toBe(190);
    expect(cart.itemCount).toBe(6);
  });

  it('marca como no disponible y excluye del total las líneas sin stock o de producto inactivo', () => {
    const cart = assembleCart([
      line({ variantId: 'v1', productPrice: 50, quantity: 2 }), // ok → 100
      line({ variantId: 'v2', productPrice: 99, quantity: 5, available: 2 }), // sin stock
      line({ variantId: 'v3', productPrice: 80, quantity: 1, productStatus: 'PAUSED' }), // inactivo
    ]);

    const lines = cart.groups[0].lines;
    expect(lines.find((l) => l.variantId === 'v2')!.unavailable).toBe(true);
    expect(lines.find((l) => l.variantId === 'v3')!.unavailable).toBe(true);
    expect(lines.find((l) => l.variantId === 'v1')!.unavailable).toBe(false);
    // Solo la línea vigente cuenta al total/itemCount.
    expect(cart.total).toBe(100);
    expect(cart.itemCount).toBe(2);
  });
});
