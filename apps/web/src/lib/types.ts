// Tipos espejo de las respuestas de la API (apps/api). Solo lo que la web usa.

export type Gender = 'HOMBRE' | 'MUJER' | 'NINO' | 'NINA' | 'UNISEX';
export type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling';

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
  createdAt: string;
}

export interface SearchResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface VariantView {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number | null;
  available: number;
  reserved: number;
}

export interface MediaView {
  id: string;
  kind: 'ORIGINAL' | 'NO_BACKGROUND' | 'OPTIMIZED';
  url: string;
  position: number;
}

export interface ProductDetail {
  id: string;
  storeId: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  gender: Gender | null;
  price: number;
  salePrice: number | null;
  status: string;
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  createdAt: string;
  variants: VariantView[];
  media: MediaView[];
}

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
}

export interface StorePage {
  store: PublicStore;
  products: SearchResult;
}

export interface SearchParams {
  q?: string;
  category?: string;
  gender?: Gender;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}
