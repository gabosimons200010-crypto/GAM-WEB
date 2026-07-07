import { Gender } from '../../catalog/domain/product';

/** Orden de resultados del catálogo público. */
export type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling';

export const SORT_OPTIONS: SortOption[] = ['relevance', 'newest', 'price_asc', 'price_desc', 'best_selling'];

/**
 * Tarjeta ligera de producto para la grilla del marketplace. No carga
 * variantes ni media completa: solo lo que la vista de listado necesita
 * (RF-MKT-001). El detalle completo vive en GET /products/:slug.
 */
export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string | null;
  gender: Gender | null;
  storeId: string;
  storeName: string;
  storeSlug: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  createdAt: Date;
}

/** Filtros de búsqueda ya validados y normalizados (ids, no slugs). */
export interface SearchFilters {
  query?: string;
  categoryId?: string;
  gender?: Gender;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  page: number; // 1-based
  pageSize: number;
}

/** Página de resultados con metadatos de paginación (offset-based). */
export interface SearchResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Proyección pública de una tienda: sin datos sensibles (RUC, email, etc.). */
export interface PublicStore {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  galleryId: string | null;
  floor: string | null;
  stand: string | null;
  rating: number;
  salesCount: number;
  verified: boolean;
  socials: { platform: string; url: string }[];
}
