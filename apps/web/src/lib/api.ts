import type { Category, ProductDetail, SearchParams, SearchResult, StorePage } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Error con el código HTTP, para distinguir 404 de fallos reales. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getJson<T>(path: string, revalidateSeconds = 30): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    // Revalidación incremental: el catálogo no cambia cada segundo.
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: SearchParams): string {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.category) q.set('category', params.category);
  if (params.gender) q.set('gender', params.gender);
  if (params.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
  if (params.sort) q.set('sort', params.sort);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function searchProducts(params: SearchParams): Promise<SearchResult> {
  return getJson<SearchResult>(`/storefront/products${buildQuery(params)}`);
}

/** Árbol de categorías (para los filtros del catálogo). */
export function listCategories(): Promise<Category[]> {
  return getJson<Category[]>('/categories');
}

/** Detalle de producto por slug. Devuelve null si no existe (404). */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await getJson<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Página de tienda por slug. Devuelve null si no existe (404). */
export async function getStorePage(slug: string, params: SearchParams = {}): Promise<StorePage | null> {
  try {
    return await getJson<StorePage>(`/storefront/stores/${encodeURIComponent(slug)}${buildQuery(params)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
