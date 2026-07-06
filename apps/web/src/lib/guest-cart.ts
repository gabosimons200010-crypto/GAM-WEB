// Cesta de invitado (sin cuenta), guardada en localStorage. Permite navegar y
// armar la cesta sin registrarse; al iniciar sesión se fusiona con la del
// servidor (ver auth-context) y se limpia.

export interface GuestCartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  storeId: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  thumbnailUrl: string | null;
  available: number;
  quantity: number;
}

const KEY = 'gg_guest_cart';
export const GUEST_CART_EVENT = 'gg-guest-cart-change';

function read(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(GUEST_CART_EVENT));
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function guestCount(): number {
  return read().reduce((a, i) => a + i.quantity, 0);
}

export function guestSubtotal(): number {
  return read().reduce((a, i) => a + i.unitPrice * i.quantity, 0);
}

export function addGuestItem(item: Omit<GuestCartItem, 'quantity'>, qty = 1): void {
  const items = read();
  const existing = items.find((i) => i.variantId === item.variantId);
  const cap = item.available > 0 ? item.available : 99;
  if (existing) existing.quantity = Math.min(existing.quantity + qty, cap);
  else items.push({ ...item, quantity: Math.min(qty, cap) });
  write(items);
}

export function setGuestQty(variantId: string, qty: number): void {
  let items = read();
  if (qty <= 0) items = items.filter((i) => i.variantId !== variantId);
  else items = items.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i));
  write(items);
}

export function removeGuestItem(variantId: string): void {
  setGuestQty(variantId, 0);
}

export function clearGuestCart(): void {
  write([]);
}
