import { randomBytes } from 'node:crypto';
import { RawCartLine, effectiveUnitPrice, isPurchasable } from '../../cart/domain/cart';

/** Comisión del marketplace sobre el subtotal de cada suborden (RF-MKT-005). */
export const COMMISSION_RATE = 0.1; // 10 %
/** Minutos que se mantiene la reserva de stock antes de liberarse si no se paga. */
export const RESERVATION_TTL_MINUTES = 30;

export interface OrderItemDraft {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
}

export interface SubOrderDraft {
  storeId: string;
  subtotal: number;
  shippingCost: number;
  commission: number;
  items: OrderItemDraft[];
}

export interface OrderTotals {
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
}

export interface OrderDraft extends OrderTotals {
  subOrders: SubOrderDraft[];
}

/** Línea de carrito que no se puede comprar (producto inactivo o sin stock). */
export interface UnavailableLine {
  variantId: string;
  productName: string;
  reason: 'inactivo' | 'sin_stock';
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Detecta las líneas no comprables del carrito al momento del checkout. */
export function findUnavailable(lines: RawCartLine[]): UnavailableLine[] {
  const out: UnavailableLine[] = [];
  for (const l of lines) {
    if (!isPurchasable(l)) {
      out.push({ variantId: l.variantId, productName: l.productName, reason: 'inactivo' });
    } else if (l.available < l.quantity) {
      out.push({ variantId: l.variantId, productName: l.productName, reason: 'sin_stock' });
    }
  }
  return out;
}

/**
 * Arma el borrador de la orden a partir de las líneas del carrito: una
 * suborden por tienda, con subtotal, comisión del marketplace y envío. El
 * envío se deja en 0 en esta fase (cálculo logístico es un sprint posterior).
 */
export function buildOrderDraft(lines: RawCartLine[]): OrderDraft {
  const byStore = new Map<string, SubOrderDraft>();

  for (const l of lines) {
    const unitPrice = effectiveUnitPrice(l);
    let sub = byStore.get(l.storeId);
    if (!sub) {
      sub = { storeId: l.storeId, subtotal: 0, shippingCost: 0, commission: 0, items: [] };
      byStore.set(l.storeId, sub);
    }
    sub.items.push({
      variantId: l.variantId,
      productName: l.productName,
      size: l.size,
      color: l.color,
      unitPrice,
      quantity: l.quantity,
    });
    sub.subtotal = round2(sub.subtotal + unitPrice * l.quantity);
  }

  const subOrders = [...byStore.values()];
  for (const s of subOrders) {
    s.commission = round2(s.subtotal * COMMISSION_RATE);
  }

  const subtotal = round2(subOrders.reduce((acc, s) => acc + s.subtotal, 0));
  const shippingTotal = round2(subOrders.reduce((acc, s) => acc + s.shippingCost, 0));
  const discountTotal = 0; // cupones: sprint posterior
  const grandTotal = round2(subtotal + shippingTotal - discountTotal);

  return { subOrders, subtotal, shippingTotal, discountTotal, grandTotal };
}

/** Número de orden legible y único: GG-XXXXXXXX (hex en mayúsculas). */
export function generateOrderNumber(): string {
  return `GG-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/** Fecha de expiración de la reserva de stock desde un instante dado. */
export function reservationExpiry(now: Date): Date {
  return new Date(now.getTime() + RESERVATION_TTL_MINUTES * 60_000);
}
