import { RawCartLine } from '../../domain/cart';

/** Datos de una variante para validar que se puede agregar al carrito. */
export interface PurchasableVariant {
  variantId: string;
  productStatus: string;
  storeStatus: string;
  available: number;
}

export abstract class CartRepository {
  /** Devuelve el id del carrito del usuario, creándolo si no existe. */
  abstract getOrCreateForUser(userId: string): Promise<string>;

  /** Líneas del carrito hidratadas con datos vivos de producto/variante/tienda. */
  abstract getLines(cartId: string): Promise<RawCartLine[]>;

  /** Estado de compra de una variante (para validar al agregar). null si no existe. */
  abstract getPurchasable(variantId: string): Promise<PurchasableVariant | null>;

  /** Suma cantidad a una línea existente o la crea (idempotente por variante). */
  abstract addOrIncrement(cartId: string, variantId: string, quantity: number): Promise<void>;

  /** Fija la cantidad exacta de una línea. */
  abstract setQuantity(cartId: string, variantId: string, quantity: number): Promise<void>;

  /** True si la línea existe en el carrito. */
  abstract hasItem(cartId: string, variantId: string): Promise<boolean>;

  abstract removeItem(cartId: string, variantId: string): Promise<void>;

  abstract clear(cartId: string): Promise<void>;
}
