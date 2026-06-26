import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentGatewayPort, ChargeRequest, ChargeResult } from '../application/ports/payment-gateway.port';
import { buildQrPayload, chargeExpiry, isQrMethod, newProviderRef } from '../domain/payment';

/**
 * Gateway de pagos de desarrollo (RF-MKT-006). Crea el cobro y, para Yape/Plin,
 * un QR; no mueve dinero real. La confirmación se simula llamando al webhook
 * (POST /payments/webhook/:provider). En producción se sustituye por el
 * adaptador del proveedor real vía DI, sin cambiar los casos de uso.
 */
@Injectable()
export class StubPaymentGateway extends PaymentGatewayPort {
  async createCharge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.method === 'CARD' && !req.cardToken) {
      throw new BadRequestException('Falta el token de la tarjeta');
    }
    const providerRef = newProviderRef();
    const provider = `stub-${req.method.toLowerCase()}`;

    if (isQrMethod(req.method)) {
      return {
        provider,
        providerRef,
        qrPayload: buildQrPayload(req.method, providerRef, req.amount),
        expiresAt: chargeExpiry(new Date()),
      };
    }
    // Tarjeta/transferencia: sin QR; el proveedor confirma luego por webhook.
    return { provider, providerRef, qrPayload: null, expiresAt: chargeExpiry(new Date()) };
  }
}
