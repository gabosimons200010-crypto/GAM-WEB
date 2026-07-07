import { RawCartLine } from '../../../cart/domain/cart';

export interface GuestItemInput {
  variantId: string;
  quantity: number;
}

/**
 * Resuelve una lista de {variantId, quantity} a líneas hidratadas (para el
 * checkout de invitado, que no tiene un carrito en el servidor).
 */
export abstract class PurchasableLinesPort {
  abstract resolve(items: GuestItemInput[]): Promise<RawCartLine[]>;
}
