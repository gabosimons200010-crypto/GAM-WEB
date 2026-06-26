import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/interface/guards/jwt-auth.guard';
import { Public } from '../../identity/interface/decorators/public.decorator';
import { CurrentUser } from '../../identity/interface/decorators/current-user.decorator';
import { AuthUser } from '../../identity/domain/auth-user';
import { CreatePaymentUseCase } from '../application/use-cases/create-payment.use-case';
import { ConfirmPaymentUseCase } from '../application/use-cases/confirm-payment.use-case';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';

/**
 * Pagos del comprador (RF-MKT-006). Crear el cobro requiere sesión; el webhook
 * de confirmación es público (lo llama el proveedor) e idempotente.
 */
@ApiTags('pagos')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPayment: CreatePaymentUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ description: 'Cobro creado. Para Yape/Plin incluye el QR a mostrar.' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.createPayment.execute({
      userId: user.sub,
      orderId: dto.orderId,
      method: dto.method,
      cardToken: dto.cardToken,
    });
  }

  @Post('webhook/:provider')
  @Public()
  @ApiOkResponse({ description: 'Confirmación del proveedor. Idempotente. Simula Yape/Plin en dev.' })
  webhook(@Param('provider') provider: string, @Body() dto: PaymentWebhookDto) {
    return this.confirmPayment.execute({
      provider,
      externalId: dto.externalId,
      providerRef: dto.providerRef,
      outcome: dto.outcome,
      raw: dto,
    });
  }
}
