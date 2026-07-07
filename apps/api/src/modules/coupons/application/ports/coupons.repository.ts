import { CouponData } from '../../domain/coupon';

/** Puerto: acceso a cupones por código. */
export abstract class CouponsRepository {
  abstract findByCode(code: string): Promise<CouponData | null>;
}
