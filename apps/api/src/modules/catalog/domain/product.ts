import { randomBytes } from 'node:crypto';

export type ProductStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'REJECTED';
export type Gender = 'HOMBRE' | 'MUJER' | 'NINO' | 'NINA' | 'UNISEX';
export type MediaKind = 'ORIGINAL' | 'NO_BACKGROUND' | 'OPTIMIZED';

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
  kind: MediaKind;
  url: string;
  position: number;
}

export interface ProductView {
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
  status: ProductStatus;
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  createdAt: Date;
  variants: VariantView[];
  media: MediaView[];
}

export interface VariantContext {
  variantId: string;
  productId: string;
  storeId: string;
  available: number;
}

function randomSuffix(len = 4): string {
  return randomBytes(len).toString('hex').slice(0, len).toUpperCase();
}

/** SKU base por producto (IA-006 lo enriquecerá; aquí, determinístico). */
export function generateProductSku(slug: string): string {
  const prefix = slug.replace(/-/g, '').slice(0, 6).toUpperCase() || 'PROD';
  return `${prefix}-${randomSuffix(4)}`;
}

/** SKU por variante: SKU de producto + códigos de talla/color (o índice). */
export function variantSku(productSku: string, size: string | null, color: string | null, index: number): string {
  const code = (s: string | null) => (s ? s.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() : '');
  const suffix = [code(size), code(color)].filter(Boolean).join('-') || String(index + 1);
  return `${productSku}-${suffix}`;
}
