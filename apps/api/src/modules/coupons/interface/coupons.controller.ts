import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ValidateCouponUseCase } from '../application/use-cases/validate-coupon.use-case';
import { ValidateCouponDto } from './dto/coupon.dto';

/** Validación pública de cupones (para previsualizar el descuento en el checkout). */
@ApiTags('cupones')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly validate: ValidateCouponUseCase) {}

  @Post('validate')
  @HttpCode(200)
  @ApiOkResponse({ description: '{ valid, discount, message } para el código y subtotal dados.' })
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.validate.execute(dto.code, dto.subtotal);
  }
}
