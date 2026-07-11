// Tipos espejo de las respuestas de la API (apps/api). Solo lo que la app usa.
// Mantener alineado con apps/web/src/lib/types.ts.

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: Category[];
}

export interface FavoriteProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string | null;
  storeName: string;
  storeSlug: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
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
  label: string | null;
  position: number;
}

export interface SizeRow {
  size: string;
  chest: number;
  length: number;
}

export interface ProductDetail {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  composition: string | null;
  care: string[];
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
  sizeChart: SizeRow[] | null;
}

export interface StoreSocial {
  platform: string;
  url: string;
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
  socials: StoreSocial[];
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

// --- Auth ---
export interface AuthUserInfo {
  sub: string;
  roles: string[];
  stores: string[];
  email: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: AuthUserInfo;
}

// --- Órdenes ---
export interface OrderItemView {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
}

export interface OrderSubView {
  id: string;
  storeId: string;
  storeName?: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  trackingCode: string | null;
  items: OrderItemView[];
}

export interface OrderView {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  createdAt: string;
  subOrders: OrderSubView[];
}

// --- Vendedor ---
export interface StoreSocialInput {
  platform: string;
  url: string;
}

export interface SellerStore {
  id: string;
  slug: string;
  commercialName: string;
  status: string;
  verified: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  legalName: string | null;
  ruc: string | null;
  contactName: string | null;
  email: string;
  phone: string;
  address: string | null;
  floor: string | null;
  stand: string | null;
  socials: StoreSocial[];
  salesCount: number;
}

export interface SellerSubOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  commission: number;
  trackingCode: string | null;
  createdAt: string;
  buyerName: string | null;
  shipTo: {
    department: string;
    province: string;
    district: string;
    line: string;
    reference: string | null;
    phone: string | null;
  } | null;
  items: OrderItemView[];
}

// --- Carrito ---
export interface CartLineView {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  available: number;
  lineTotal: number;
  thumbnailUrl: string | null;
  unavailable: boolean;
}

export interface CartStoreGroup {
  storeId: string;
  storeName: string;
  storeSlug: string;
  lines: CartLineView[];
  subtotal: number;
}

export interface CartView {
  groups: CartStoreGroup[];
  itemCount: number;
  total: number;
}

// --- Pagos y checkout ---
export interface PaymentView {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  qrPayload: string | null;
  providerRef: string | null;
  expiresAt: string | null;
}

export interface ShippingAddressInput {
  department: string;
  province: string;
  district: string;
  line: string;
  reference?: string;
  phone?: string;
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  message: string;
}
