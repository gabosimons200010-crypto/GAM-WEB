import { PaymentMethod } from '../../domain/payment';

export interface PayableOrder {
  id: string;
  number: string;
  status: string;
  grandTotal: number;
}

export interface CreatePaymentData {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  provider: string;
  providerRef: string;
  qrPayload?: string | null;
  expiresAt?: Date | null;
  cardToken?: string | null;
}

export interface PaymentView {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: string;
  amount: number;
  qrPayload: string | null;
  providerRef: string | null;
  expiresAt: Date | null;
}

export interface PaymentRef {
  id: string;
  orderId: string;
  status: string;
}

export interface PaidResult {
  orderId: string;
  number: string;
  /** false si la orden ya estaba pagada (confirmación repetida). */
  changed: boolean;
}

export abstract class PaymentRepository {
  /** Orden pagable del usuario (debe pertenecerle). null si no existe/no es suya. */
  abstract getPayableOrder(orderId: string, userId: string): Promise<PayableOrder | null>;

  /** True si la orden ya tiene un pago confirmado (evita doble cobro). */
  abstract hasConfirmedPayment(orderId: string): Promise<boolean>;

  abstract create(data: CreatePaymentData): Promise<PaymentView>;

  abstract findByProviderRef(provider: string, providerRef: string): Promise<PaymentRef | null>;

  /**
   * Registra el evento de webhook una sola vez (idempotencia por
   * [provider, externalId]). Devuelve false si ya se había procesado.
   */
  abstract recordWebhookOnce(provider: string, externalId: string, paymentId: string | null, payload: unknown): Promise<boolean>;

  /**
   * Confirma el pago en una transacción: pago→CONFIRMED, orden→PAID,
   * subórdenes→PAID, consume las reservas (libera `reserved`, suma soldCount y
   * salesCount, borra la reserva). Idempotente: si ya estaba pagada, changed=false.
   */
  abstract markPaid(paymentId: string): Promise<PaidResult>;

  /** Marca el pago como fallido/expirado (no toca el stock; lo libera el job de expiración). */
  abstract markUnpaid(paymentId: string, status: 'FAILED' | 'EXPIRED'): Promise<void>;
}
