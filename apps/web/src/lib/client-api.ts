'use client';

import { getToken } from './session';
import type {
  AdminStore,
  AIBatch,
  CartView,
  CreateProductInput,
  FavoriteProduct,
  LoginResponse,
  Review,
  OrderView,
  PaymentView,
  ProductDetail,
  SellerStore,
  SellerSubOrder,
  ShippingAddressInput,
  UploadUrlResult,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Extrae un mensaje legible del cuerpo de error del backend. */
function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return fallback;
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    credentials: 'include',
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ClientApiError(res.status, messageFrom(body, `Error ${res.status}`));
  }
  return body as T;
}

// --- Auth ---
export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), auth: false });
}

export function register(email: string, password: string, fullName?: string): Promise<unknown> {
  return request('/auth/register/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
    auth: false,
  });
}

/**
 * Solicita el enlace de recuperación. En producción responde uniforme; en demo
 * (sin correo saliente) el backend devuelve `demoToken` para continuar el flujo.
 */
export function requestPasswordReset(email: string): Promise<{ ok: boolean; demoToken?: string | null }> {
  return request('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }), auth: false });
}

/** Fija la nueva contraseña con el token del enlace. */
export function resetPassword(email: string, token: string, password: string): Promise<{ ok: boolean }> {
  return request('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, token, password }),
    auth: false,
  });
}

// --- Carrito ---
export function getCart(): Promise<CartView> {
  return request<CartView>('/cart');
}

export function addToCart(variantId: string, quantity: number): Promise<CartView> {
  return request<CartView>('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
}

export function updateCartItem(variantId: string, quantity: number): Promise<CartView> {
  return request<CartView>(`/cart/items/${variantId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export function removeCartItem(variantId: string): Promise<CartView> {
  return request<CartView>(`/cart/items/${variantId}`, { method: 'DELETE' });
}

// --- Checkout y pagos ---
export interface CheckoutBody {
  address: ShippingAddressInput;
  buyerName?: string;
  buyerPhone?: string;
  buyerDni?: string;
  couponCode?: string;
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  message: string;
}

export function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  return request<CouponResult>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
    auth: false,
  });
}

export function checkout(body: CheckoutBody): Promise<OrderView> {
  return request<OrderView>('/checkout', { method: 'POST', body: JSON.stringify(body) });
}

export function createPayment(orderId: string, method: string): Promise<PaymentView> {
  return request<PaymentView>('/payments', { method: 'POST', body: JSON.stringify({ orderId, method }) });
}

// --- Checkout de invitado (sin cuenta) ---
export interface GuestCheckoutBody {
  items: { variantId: string; quantity: number }[];
  address: ShippingAddressInput;
  email: string;
  name?: string;
  phone?: string;
  couponCode?: string;
}

export function guestCheckout(body: GuestCheckoutBody): Promise<OrderView> {
  return request<OrderView>('/checkout/guest', { method: 'POST', body: JSON.stringify(body), auth: false });
}

export function createGuestPayment(orderId: string, method: string): Promise<PaymentView> {
  return request<PaymentView>('/payments/guest', { method: 'POST', body: JSON.stringify({ orderId, method }), auth: false });
}

/**
 * DEMO: simula el webhook del proveedor confirmando el pago. En producción
 * lo llama Yape/Plin, no el cliente. El provider del stub es `stub-<metodo>`.
 */
export function simulatePaymentConfirmation(method: string, providerRef: string): Promise<unknown> {
  const provider = `stub-${method.toLowerCase()}`;
  const externalId = `sim-${providerRef}`;
  return request(`/payments/webhook/${provider}`, {
    method: 'POST',
    body: JSON.stringify({ externalId, providerRef, outcome: 'CONFIRMED' }),
    auth: false,
  });
}

// --- Favoritos ---
export function listFavorites(): Promise<FavoriteProduct[]> {
  return request<FavoriteProduct[]>('/favorites');
}

export function listFavoriteIds(): Promise<string[]> {
  return request<string[]>('/favorites/ids');
}

export function addFavorite(productId: string): Promise<unknown> {
  return request('/favorites', { method: 'POST', body: JSON.stringify({ productId }) });
}

export function removeFavorite(productId: string): Promise<unknown> {
  return request(`/favorites/${productId}`, { method: 'DELETE' });
}

// --- Reseñas ---
export function listReviews(productId: string): Promise<Review[]> {
  return request<Review[]>(`/products/${productId}/reviews`, { auth: false });
}

export function createReview(productId: string, rating: number, comment?: string): Promise<unknown> {
  return request(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
}

/** ¿El usuario en sesión compró este producto? (para mostrar el formulario de reseña). */
export function canReview(productId: string): Promise<{ canReview: boolean }> {
  return request(`/products/${productId}/reviews/can-review`);
}

// --- Órdenes ---
export function listOrders(): Promise<{ items: OrderView[]; nextCursor: string | null }> {
  return request('/orders');
}

export function getOrder(id: string): Promise<OrderView> {
  return request<OrderView>(`/orders/${id}`);
}

/** Rastreo público por número + correo (sin sesión). */
export function trackOrder(number: string, email: string): Promise<OrderView> {
  return request<OrderView>('/orders/track', {
    method: 'POST',
    body: JSON.stringify({ number, email }),
    auth: false,
  });
}

// --- Vendedor: tiendas ---
export interface RegisterStoreBody {
  commercialName: string;
  email: string;
  phone: string;
  legalName?: string;
  ruc?: string;
  floor?: string;
  stand?: string;
  address?: string;
}

export function getMyStores(): Promise<SellerStore[]> {
  return request<SellerStore[]>('/seller/stores');
}

export function registerStore(body: RegisterStoreBody): Promise<SellerStore> {
  return request<SellerStore>('/seller/stores', { method: 'POST', body: JSON.stringify(body) });
}

// --- Vendedor: productos ---
export function listMyProducts(storeId: string, status?: string): Promise<{ items: ProductDetail[]; nextCursor: string | null }> {
  const q = status ? `?status=${status}` : '';
  return request(`/seller/stores/${storeId}/products${q}`);
}

export function createProduct(storeId: string, body: CreateProductInput): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products`, { method: 'POST', body: JSON.stringify(body) });
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  /** number = fijar oferta · null = quitar la oferta · omitir = dejar igual. */
  salePrice?: number | null;
}

/** Edita campos escalares del producto (nombre, descripción, precio, oferta). */
export function updateProduct(storeId: string, productId: string, body: UpdateProductInput): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Publica un borrador o reactiva un producto pausado (→ ACTIVE o IN_REVIEW). */
export function publishProduct(storeId: string, productId: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products/${productId}/publish`, { method: 'POST' });
}

/** Pausa un producto activo (lo oculta del catálogo, reversible con publicar). */
export function pauseProduct(storeId: string, productId: string): Promise<ProductDetail> {
  return request<ProductDetail>(`/seller/stores/${storeId}/products/${productId}/pause`, { method: 'POST' });
}

/** Ajusta el stock disponible de una variante (se refleja de inmediato en la tienda). */
export function adjustInventory(
  storeId: string,
  variantId: string,
  available: number,
): Promise<{ variantId: string; available: number; lowStock: boolean }> {
  return request(`/seller/stores/${storeId}/products/variants/${variantId}/inventory`, {
    method: 'PATCH',
    body: JSON.stringify({ available }),
  });
}

// --- Vendedor: pedidos ---
export function listSellerOrders(status?: string): Promise<{ items: SellerSubOrder[]; nextCursor: string | null }> {
  const q = status ? `?status=${status}` : '';
  return request(`/seller/orders${q}`);
}

export function advanceOrderStatus(
  subOrderId: string,
  to: string,
  note?: string,
  trackingCode?: string,
): Promise<SellerSubOrder> {
  return request<SellerSubOrder>(`/seller/orders/${subOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ to, note, trackingCode }),
  });
}

// --- Vendedor: carga con IA ---
export function requestUploadUrl(storeId: string, contentType: string): Promise<UploadUrlResult> {
  return request<UploadUrlResult>(`/seller/stores/${storeId}/products/upload-url`, {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });
}

/** Sube el archivo directo al storage (MinIO/S3) con la URL prefirmada. */
export async function uploadToStorage(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!res.ok) {
    throw new ClientApiError(res.status, `No se pudo subir la imagen (${res.status})`);
  }
}

export function createAiBatch(storeId: string, imageKeys: string[]): Promise<AIBatch> {
  return request<AIBatch>(`/seller/stores/${storeId}/ai/batches`, {
    method: 'POST',
    body: JSON.stringify({ imageKeys }),
  });
}

export function getAiBatch(storeId: string, batchId: string): Promise<AIBatch> {
  return request<AIBatch>(`/seller/stores/${storeId}/ai/batches/${batchId}`);
}

// --- Admin: tiendas ---
export function adminListStores(status?: string): Promise<{ items: AdminStore[]; nextCursor: string | null }> {
  const q = status ? `?status=${status}` : '';
  return request(`/admin/stores${q}`);
}

export function adminApproveStore(id: string): Promise<unknown> {
  return request(`/admin/stores/${id}/approve`, { method: 'POST' });
}

export function adminVerifyStore(id: string, verified: boolean): Promise<unknown> {
  return request(`/admin/stores/${id}/${verified ? 'verify' : 'unverify'}`, { method: 'POST' });
}

export function adminRejectStore(id: string, reason: string): Promise<unknown> {
  return request(`/admin/stores/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function adminSuspendStore(id: string, reason: string): Promise<unknown> {
  return request(`/admin/stores/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
}

// --- Admin: moderación de productos ---
export function adminListModeration(): Promise<{ items: ProductDetail[]; nextCursor: string | null }> {
  return request('/admin/products/moderation');
}

export function adminApproveProduct(productId: string): Promise<unknown> {
  return request(`/admin/products/moderation/${productId}/approve`, { method: 'POST' });
}

export function adminRejectProduct(productId: string, reason: string): Promise<unknown> {
  return request(`/admin/products/moderation/${productId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
}
