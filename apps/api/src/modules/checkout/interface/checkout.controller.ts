import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { Public } from '../../identity/interface/decorators/public.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { CheckoutUseCase } from '../application/use-cases/checkout.use-case';
import { GuestCheckoutUseCase } from '../application/use-cases/guest-checkout.use-case';
import { CheckoutDto } from './dto/checkout.dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';

/**
 * Checkout del comprador (RF-MKT-004). Toma el carrito vigente del usuario y
 * crea la orden (dividida por tienda) en estado PENDING_PAYMENT, reservando el
 * stock. Requiere sesión.
 */
@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutUseCase,
    private readonly guestCheckout: GuestCheckoutUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ description: 'Orden creada en PENDING_PAYMENT con el stock reservado.' })
  place(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.checkout.execute({
      userId: user.sub,
      address: dto.address,
      buyer: { name: dto.buyerName, email: dto.buyerEmail, phone: dto.buyerPhone, dni: dto.buyerDni },
      couponCode: dto.couponCode,
    });
  }

  /** Checkout sin cuenta: los ítems vienen en el cuerpo. Público. */
  @Post('guest')
  @Public()
  @ApiCreatedResponse({ description: 'Orden de invitado creada en PENDING_PAYMENT.' })
  placeGuest(@Body() dto: GuestCheckoutDto) {
    return this.guestCheckout.execute({
      items: dto.items,
      address: dto.address,
      buyer: { name: dto.name, email: dto.email, phone: dto.phone, dni: dto.dni },
      couponCode: dto.couponCode,
    });
  }
}
