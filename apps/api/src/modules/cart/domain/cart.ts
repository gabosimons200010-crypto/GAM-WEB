/**
 * Modelo de carrito multi-tienda (RF-MKT-003). Un carrito puede contener
 * productos de varias tiendas de Gamarra; al pagar se divide en una suborden
 * por tienda (Sprint 9). Aquí solo el lado de lectura y el armado de totales.
 */

/** Línea hidratada por el repositorio: ítem + datos vivos del producto/variante. */
export interface RawCartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productStatus: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeStatus: string;
  size: string | null;
  color: string | null;
  variantPrice: number | null;
  productPrice: number;
  productSalePrice: number | null;
  available: number;
  quantity: number;
  thumbnailUrl: string | null;
}

export interface CartLineView {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  available: number;
  lineTotal: number;
  thumbnailUrl: string | null;
  /** El producto dejó de estar disponible (pausado/agotado) pero sigue en el carrito. */
  unavailable: boolean;
}

export interface CartStoreGroup {
  storeId: string;
  storeName: string;
  storeSlug: string;
  lines: CartLineView[];
  subtotal: number;
}

export interface CartView {
  groups: CartStoreGroup[];
  itemCount: number;
  total: number;
}

/**
 * Precio efectivo de una línea: la variante manda; si no tiene precio propio,
 * usa la oferta del producto y, en su defecto, el precio base. Mantiene la
 * regla de precios en un solo lugar (dominio), no esparcida por los repos.
 */
export function effectiveUnitPrice(line: RawCartLine): number {
  if (line.variantPrice !== null) return line.variantPrice;
  if (line.productSalePrice !== null) return line.productSalePrice;
  return line.productPrice;
}

/** Una línea es comprable si su producto está ACTIVE y su tienda APPROVED. */
export function isPurchasable(line: Pick<RawCartLine, 'productStatus' | 'storeStatus'>): boolean {
  return line.productStatus === 'ACTIVE' && line.storeStatus === 'APPROVED';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Agrupa las líneas por tienda y calcula subtotales y total general. */
export function assembleCart(lines: RawCartLine[]): CartView {
  const groups = new Map<string, CartStoreGroup>();
  let itemCount = 0;
  let total = 0;

  for (const line of lines) {
    const unitPrice = effectiveUnitPrice(line);
    const lineTotal = round2(unitPrice * line.quantity);
    const unavailable = !isPurchasable(line) || line.available < line.quantity;

    const view: CartLineView = {
      variantId: line.variantId,
      productId: line.productId,
      productSlug: line.productSlug,
      productName: line.productName,
      size: line.size,
      color: line.color,
      unitPrice,
      quantity: line.quantity,
      available: line.available,
      lineTotal,
      thumbnailUrl: line.thumbnailUrl,
      unavailable,
    };

    let group = groups.get(line.storeId);
    if (!group) {
      group = { storeId: line.storeId, storeName: line.storeName, storeSlug: line.storeSlug, lines: [], subtotal: 0 };
      groups.set(line.storeId, group);
    }
    group.lines.push(view);
    // Solo cuentan al total las líneas vigentes (no las marcadas como no disponibles).
    if (!unavailable) {
      group.subtotal = round2(group.subtotal + lineTotal);
      total = round2(total + lineTotal);
      itemCount += line.quantity;
    }
  }

  return { groups: [...groups.values()], itemCount, total };
}

export const MAX_QTY_PER_LINE = 50;
