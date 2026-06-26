import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';

import { PaymentController } from './interface/payment.controller';
import { PaymentRepository } from './application/ports/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/prisma-payment.repository';
import { PaymentGatewayPort } from './application/ports/payment-gateway.port';
import { StubPaymentGateway } from './infrastructure/stub-payment-gateway';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';

/**
 * Bounded context PAYMENT (Sprint 10, Fase 2): cobra las órdenes y confirma
 * por webhook. Importa IdentityModule por JwtAuthGuard. El gateway es un stub
 * en dev (QR Yape/Plin simulado); en producción se sustituye por Niubiz/Culqi
 * vía DI. Al confirmar, la orden pasa a PAID y se consume la reserva de stock.
 */
@Module({
  imports: [IdentityModule],
  controllers: [PaymentController],
  providers: [
    { provide: PaymentRepository, useClass: PrismaPaymentRepository },
    { provide: PaymentGatewayPort, useClass: StubPaymentGateway },
    CreatePaymentUseCase,
    ConfirmPaymentUseCase,
  ],
})
export class PaymentModule {}
