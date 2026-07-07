export interface ReviewView {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
}

/** Puerto: reseñas de producto (modelo Review). Actualiza el promedio del producto. */
export abstract class ReviewsRepository {
  /** Crea o actualiza la reseña del usuario para el producto y recalcula el promedio. */
  abstract upsert(userId: string, productId: string, rating: number, comment?: string): Promise<void>;
  abstract listForProduct(productId: string): Promise<ReviewView[]>;
  /** true si el usuario compró (y pagó) el producto en alguna orden. */
  abstract hasPurchasedProduct(userId: string, productId: string): Promise<boolean>;
}
