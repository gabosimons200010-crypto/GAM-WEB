'use client';

import { getToken } from './session';
import type {
  CartView,
  LoginResponse,
  OrderView,
  PaymentView,
  ShippingAddressInput,
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
}

export function checkout(body: CheckoutBody): Promise<OrderView> {
  return request<OrderView>('/checkout', { method: 'POST', body: JSON.stringify(body) });
}

export function createPayment(orderId: string, method: string): Promise<PaymentView> {
  return request<PaymentView>('/payments', { method: 'POST', body: JSON.stringify({ orderId, method }) });
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

// --- Órdenes ---
export function listOrders(): Promise<{ items: OrderView[]; nextCursor: string | null }> {
  return request('/orders');
}

export function getOrder(id: string): Promise<OrderView> {
  return request<OrderView>(`/orders/${id}`);
}
