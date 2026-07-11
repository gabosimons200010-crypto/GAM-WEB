import Constants from 'expo-constants';

import type {
  CartView,
  Category,
  CouponResult,
  FavoriteProduct,
  LoginResponse,
  OrderView,
  PaymentView,
  ProductDetail,
  Review,
  SearchParams,
  SearchResult,
  SellerStore,
  SellerSubOrder,
  ShippingAddressInput,
  StorePage,
} from './types';

/**
 * Deriva el host de la API del servidor de desarrollo de Expo.
 *
 * Al abrir la app en Expo Go, el teléfono NO puede usar `localhost` (ese es el
 * propio teléfono). Pero Expo conoce la IP de la PC en la red local (la misma
 * que sirve el bundle de Metro), así que la reutilizamos y solo cambiamos el
 * puerto al de la API (4000). Así funciona sin hardcodear la IP y se adapta si
 * la IP de la PC cambia. En un build de producción se usa EXPO_PUBLIC_API_URL.
 */
function deriveHost(): string {
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
  };
  const hostUri =
    c.expoConfig?.hostUri ?? c.expoGoConfig?.debuggerHost ?? c.manifest?.debuggerHost ?? '';
  const host = String(hostUri).split(':')[0];
  return host || 'localhost';
}

const API_PORT = 4000;
const WEB_PORT = 3000;

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${deriveHost()}:${API_PORT}/api/v1`;

/**
 * Origen de la web (Next.js). Sirve las imágenes estáticas del demo
 * (`/media/...`), que NO están en la API. En producción sería el CDN.
 */
export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? `http://${deriveHost()}:${WEB_PORT}`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return fallback;
}

// Token en memoria (la persistencia con SecureStore se añade con el login).
let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(headers as Record<string, string>),
  };
  if (auth && accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con la tienda (${BASE_URL}).`);
  }

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, messageFrom(parsed, `Error ${res.status}`));
  return parsed as T;
}

// --- Catálogo (público) ---
export function searchProducts(params: SearchParams = {}): Promise<SearchResult> {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.category) q.set('category', params.category);
  if (params.gender) q.set('gender', params.gender);
  if (params.minPrice != null) q.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
  if (params.sort) q.set('sort', params.sort);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const qs = q.toString();
  return request<SearchResult>(`/storefront/products${qs ? `?${qs}` : ''}`, { auth: false });
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${slug}`, { auth: false });
}

export function listCategories(): Promise<Category[]> {
  return request<Category[]>('/categories', { auth: false });
}

export function getStorePage(slug: string, sort?: string): Promise<StorePage> {
  const q = sort ? `?sort=${sort}` : '';
  return request<StorePage>(`/storefront/stores/${slug}${q}`, { auth: false });
}

// --- Auth ---
export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function register(email: string, password: string, fullName?: string): Promise<unknown> {
  return request('/auth/register/email', {
    method: 'POST',
    body: { email, password, fullName },
    auth: false,
  });
}

/** Solicita el enlace de recuperación. En demo devuelve `demoToken` (sin correo real). */
export function requestPasswordReset(email: string): Promise<{ ok: boolean; demoToken?: string | null }> {
  return request('/auth/password/forgot', { method: 'POST', body: { email }, auth: false });
}

export function resetPassword(email: string, token: string, password: string): Promise<{ ok: boolean }> {
  return request('/auth/password/reset', { method: 'POST', body: { email, token, password }, auth: false });
}

// --- Carrito ---
export function getCart(): Promise<CartView> {
  return request<CartView>('/cart');
}

export function addToCart(variantId: string, quantity: number): Promise<CartView> {
  return request<CartView>('/cart/items', { method: 'POST', body: { variantId, quantity } });
}

export function updateCartItem(variantId: string, quantity: number): Promise<CartView> {
  return request<CartView>(`/cart/items/${variantId}`, { method: 'PATCH', body: { quantity } });
}

export function removeCartItem(variantId: string): Promise<CartView> {
  return request<CartView>(`/cart/items/${variantId}`, { method: 'DELETE' });
}

// --- Cupones, checkout y pagos ---
export function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  return request<CouponResult>('/coupons/validate', {
    method: 'POST',
    body: { code, subtotal },
    auth: false,
  });
}

export interface CheckoutBody {
  address: ShippingAddressInput;
  buyerName?: string;
  buyerPhone?: string;
  couponCode?: string;
}

export function checkout(body: CheckoutBody): Promise<OrderView> {
  return request<OrderView>('/checkout', { method: 'POST', body });
}

export function createPayment(orderId: string, method: string): Promise<PaymentView> {
  return request<PaymentView>('/payments', { method: 'POST', body: { orderId, method } });
}

/**
 * DEMO: simula el webhook del proveedor confirmando el pago. En producción lo
 * llama Yape/Plin, no el cliente. El provider del stub es `stub-<metodo>`.
 */
export function simulatePaymentConfirmation(method: string, providerRef: string): Promise<unknown> {
  const provider = `stub-${method.toLowerCase()}`;
  return request(`/payments/webhook/${provider}`, {
    method: 'POST',
    body: { externalId: `sim-${providerRef}`, providerRef, outcome: 'CONFIRMED' },
    auth: false,
  });
}

// --- Órdenes ---
export function listOrders(): Promise<{ items: OrderView[]; nextCursor: string | null }> {
  return request('/orders');
}

export function getOrder(id: string): Promise<OrderView> {
  return request<OrderView>(`/orders/${id}`);
}

export function cancelOrder(id: string): Promise<OrderView> {
  return request<OrderView>(`/orders/${id}/cancel`, { method: 'POST' });
}

/** Rastreo público por número + correo (sin sesión). */
export function trackOrder(number: string, email: string): Promise<OrderView> {
  return request<OrderView>('/orders/track', { method: 'POST', body: { number, email }, auth: false });
}

// --- Direcciones (libreta del comprador) ---
export interface Address {
  id: string;
  department: string;
  province: string;
  district: string;
  line: string;
  reference: string | null;
  phone: string | null;
  isDefault: boolean;
}
export interface CreateAddressBody {
  department: string;
  province: string;
  district: string;
  line: string;
  reference?: string;
  phone?: string;
  isDefault?: boolean;
}
export function listAddresses(): Promise<Address[]> {
  return request<Address[]>('/addresses');
}
export function createAddress(body: CreateAddressBody): Promise<Address> {
  return request<Address>('/addresses', { method: 'POST', body });
}
export function deleteAddress(id: string): Promise<unknown> {
  return request(`/addresses/${id}`, { method: 'DELETE' });
}
export function setDefaultAddress(id: string): Promise<Address> {
  return request<Address>(`/addresses/${id}/default`, { method: 'POST' });
}

// --- Favoritos ---
export function listFavorites(): Promise<FavoriteProduct[]> {
  return request<FavoriteProduct[]>('/favorites');
}

export function listFavoriteIds(): Promise<string[]> {
  return request<string[]>('/favorites/ids');
}

export function addFavorite(productId: string): Promise<unknown> {
  return request('/favorites', { method: 'POST', body: { productId } });
}

export function removeFavorite(productId: string): Promise<unknown> {
  return request(`/favorites/${productId}`, { method: 'DELETE' });
}

// --- Reseñas ---
export function listReviews(productId: string): Promise<Review[]> {
  return request<Review[]>(`/products/${productId}/reviews`, { auth: false });
}

export function createReview(productId: string, rating: number, comment?: string): Promise<unknown> {
  return request(`/products/${productId}/reviews`, { method: 'POST', body: { rating, comment } });
}

export function canReview(productId: string): Promise<{ canReview: boolean }> {
  return request(`/products/${productId}/reviews/can-review`);
}

// --- Vendedor (simplificado) ---
export function getMyStores(): Promise<SellerStore[]> {
  return request<SellerStore[]>('/seller/stores');
}

export function listMyProducts(
  storeId: string,
  status?: string,
): Promise<{ items: ProductDetail[]; nextCursor: string | null }> {
  const q = status ? `?status=${status}` : '';
  return request(`/seller/stores/${storeId}/products${q}`);
}

export function adjustInventory(
  storeId: string,
  variantId: string,
  available: number,
): Promise<{ variantId: string; available: number; lowStock: boolean }> {
  return request(`/seller/stores/${storeId}/products/variants/${variantId}/inventory`, {
    method: 'PATCH',
    body: { available },
  });
}

export function pauseProduct(storeId: string, productId: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products/${productId}/pause`, { method: 'POST' });
}

export function publishProduct(storeId: string, productId: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products/${productId}/publish`, { method: 'POST' });
}

export function listSellerOrders(
  status?: string,
): Promise<{ items: SellerSubOrder[]; nextCursor: string | null }> {
  const q = status ? `?status=${status}` : '';
  return request(`/seller/orders${q}`);
}

export function advanceOrderStatus(
  subOrderId: string,
  to: string,
  trackingCode?: string,
): Promise<SellerSubOrder> {
  return request<SellerSubOrder>(`/seller/orders/${subOrderId}/status`, {
    method: 'PATCH',
    body: { to, trackingCode },
  });
}
