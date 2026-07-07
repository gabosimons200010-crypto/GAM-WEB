import { Module } from '@nestjs/common';
import { CouponsController } from './interface/coupons.controller';
import { CouponsRepository } from './application/ports/coupons.repository';
import { PrismaCouponsRepository } from './infrastructure/prisma-coupons.repository';
import { ValidateCouponUseCase } from './application/use-cases/validate-coupon.use-case';

/** Bounded context COUPONS: cupones de descuento. Exporta el repositorio para el checkout. */
@Module({
  controllers: [CouponsController],
  providers: [
    { provide: CouponsRepository, useClass: PrismaCouponsRepository },
    ValidateCouponUseCase,
  ],
  exports: [CouponsRepository],
})
export class CouponsModule {}
