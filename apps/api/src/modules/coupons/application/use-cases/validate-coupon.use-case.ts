import { Injectable } from '@nestjs/common';
import { CouponsRepository } from '../ports/coupons.repository';
import { CouponResult, evaluateCoupon } from '../../domain/coupon';

/** Valida un cupón por código contra un subtotal y devuelve el descuento. */
@Injectable()
export class ValidateCouponUseCase {
  constructor(private readonly coupons: CouponsRepository) {}

  async execute(code: string, subtotal: number): Promise<CouponResult> {
    const coupon = await this.coupons.findByCode(code);
    return evaluateCoupon(coupon, subtotal, new Date());
  }
}
