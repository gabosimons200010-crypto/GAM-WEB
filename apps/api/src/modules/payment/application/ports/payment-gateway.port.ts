import { PaymentMethod } from '../../domain/payment';

export interface ChargeRequest {
  method: PaymentMethod;
  amount: number;
  currency: string;
  orderNumber: string;
  cardToken?: string | null;
}

export interface ChargeResult {
  provider: string; // identificador del proveedor: 'stub-yape', 'culqi', ...
  providerRef: string; // id de la transacción en el proveedor
  qrPayload?: string | null; // solo para métodos QR (Yape/Plin)
  expiresAt?: Date | null;
}

/**
 * Puerto del proveedor de pagos. El stub (dev) genera el QR y la referencia;
 * en producción se reemplaza por un adaptador Niubiz/Culqi sin tocar los casos
 * de uso. La confirmación siempre llega por webhook (RF-MKT-006).
 */
export abstract class PaymentGatewayPort {
  abstract createCharge(req: ChargeRequest): Promise<ChargeResult>;
}
