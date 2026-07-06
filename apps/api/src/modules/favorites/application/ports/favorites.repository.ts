export interface FavoriteProductView {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string | null;
  storeName: string;
  storeSlug: string;
}

/** Puerto: lista de deseos del comprador (modelo Favorite). */
export abstract class FavoritesRepository {
  abstract add(userId: string, productId: string): Promise<void>;
  abstract remove(userId: string, productId: string): Promise<void>;
  /** Productos ACTIVE marcados como favoritos, más recientes primero. */
  abstract listProducts(userId: string): Promise<FavoriteProductView[]>;
  /** Solo los ids de producto favoritos (para pintar el corazón en la UI). */
  abstract listIds(userId: string): Promise<string[]>;
}
