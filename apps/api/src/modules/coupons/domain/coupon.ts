export type CouponType = 'PERCENT' | 'FIXED';
export type CouponScope = 'STORE' | 'GLOBAL';

export interface CouponData {
  code: string;
  scope: CouponScope;
  type: CouponType;
  value: number;
  minPurchase: number | null;
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  message: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Valida un cupón contra un subtotal y calcula el descuento (topado al subtotal). */
export function evaluateCoupon(coupon: CouponData | null, subtotal: number, now: Date): CouponResult {
  if (!coupon || !coupon.active) {
    return { valid: false, discount: 0, message: 'Cupón no válido' };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, discount: 0, message: 'El cupón aún no está disponible' };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { valid: false, discount: 0, message: 'El cupón está vencido' };
  }
  if (coupon.minPurchase !== null && subtotal < coupon.minPurchase) {
    return { valid: false, discount: 0, message: `Compra mínima de S/ ${coupon.minPurchase.toFixed(2)}` };
  }
  const raw = coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
  const discount = round2(Math.min(raw, subtotal));
  return { valid: true, discount, message: 'Cupón aplicado' };
}
