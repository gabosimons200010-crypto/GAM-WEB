import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { CheckoutUseCase } from '../application/use-cases/checkout.use-case';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Checkout del comprador (RF-MKT-004). Toma el carrito vigente del usuario y
 * crea la orden (dividida por tienda) en estado PENDING_PAYMENT, reservando el
 * stock. Requiere sesión.
 */
@ApiTags('checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutUseCase) {}

  @Post()
  @ApiCreatedResponse({ description: 'Orden creada en PENDING_PAYMENT con el stock reservado.' })
  place(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.checkout.execute({
      userId: user.sub,
      address: dto.address,
      buyer: { name: dto.buyerName, email: dto.buyerEmail, phone: dto.buyerPhone, dni: dto.buyerDni },
    });
  }
}
