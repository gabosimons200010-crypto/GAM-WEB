import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CouponsRepository } from '../application/ports/coupons.repository';
import { CouponData } from '../domain/coupon';

@Injectable()
export class PrismaCouponsRepository extends CouponsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByCode(code: string): Promise<CouponData | null> {
    const row = await this.prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!row) return null;
    return {
      code: row.code,
      scope: row.scope,
      type: row.type,
      value: Number(row.value),
      minPurchase: row.minPurchase !== null ? Number(row.minPurchase) : null,
      active: row.active,
      startsAt: row.startsAt,
      expiresAt: row.expiresAt,
    };
  }
}
