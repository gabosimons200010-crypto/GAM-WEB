import { Gender, MediaKind, ProductStatus, ProductView, VariantContext } from '../../domain/product';

export interface NewVariant {
  sku: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  price?: number | null;
  stock: number;
}

export interface CreateProductData {
  storeId: string;
  slug: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  gender?: Gender | null;
  price: number;
  salePrice?: number | null;
  tags?: string[];
  attributes?: Record<string, unknown> | null;
  variants: NewVariant[];
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  gender?: Gender | null;
  price?: number;
  salePrice?: number | null;
  tags?: string[];
}

export interface AddMediaData {
  kind: MediaKind;
  url: string;
  position?: number;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

export interface ListProductsFilter {
  storeId: string;
  status?: ProductStatus;
  lowStock?: boolean;
  lowStockThreshold?: number;
  cursor?: string;
  limit: number;
}

export abstract class ProductRepository {
  abstract slugExists(slug: string): Promise<boolean>;
  abstract create(data: CreateProductData): Promise<ProductView>;
  abstract findById(id: string): Promise<ProductView | null>;
  abstract findActiveBySlug(slug: string): Promise<ProductView | null>;
  abstract listByStore(filter: ListProductsFilter): Promise<{ items: ProductView[]; nextCursor: string | null }>;
  /** Productos en revisión, para la cola de moderación del admin (RF-ADM-002). */
  abstract listModeration(cursor: string | undefined, limit: number): Promise<{ items: ProductView[]; nextCursor: string | null }>;
  abstract updateScalars(id: string, data: UpdateProductData): Promise<ProductView>;
  abstract setStatus(id: string, status: ProductStatus): Promise<void>;
  abstract archive(id: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract addMedia(productId: string, media: AddMediaData): Promise<void>;
  abstract getVariantContext(variantId: string): Promise<VariantContext | null>;
  abstract setVariantAvailable(variantId: string, available: number): Promise<void>;
}
