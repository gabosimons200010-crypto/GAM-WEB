import { randomBytes } from 'node:crypto';

export type PaymentMethod = 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER';

export const PAYMENT_METHODS: PaymentMethod[] = ['YAPE', 'PLIN', 'CARD', 'TRANSFER'];

/** Métodos que se cobran mostrando un QR (billeteras móviles peruanas). */
export const QR_METHODS: PaymentMethod[] = ['YAPE', 'PLIN'];

/** Minutos de validez de un cobro QR antes de expirar. */
export const CHARGE_TTL_MINUTES = 15;

export function isQrMethod(method: PaymentMethod): boolean {
  return QR_METHODS.includes(method);
}

/** Referencia única del proveedor (en el stub; un gateway real la trae él). */
export function newProviderRef(): string {
  return `ref_${randomBytes(8).toString('hex')}`;
}

/**
 * Genera el contenido de un QR de billetera. En producción el proveedor
 * (Yape/Plin vía Niubiz/Culqi) entrega el payload EMVCo real; aquí es un
 * deep-link determinístico que la app del comprador puede renderizar.
 */
export function buildQrPayload(method: PaymentMethod, providerRef: string, amount: number): string {
  const wallet = method.toLowerCase();
  return `https://pay.gamarra.go/${wallet}?ref=${providerRef}&amount=${amount.toFixed(2)}&cur=PEN`;
}

export function chargeExpiry(now: Date): Date {
  return new Date(now.getTime() + CHARGE_TTL_MINUTES * 60_000);
}
