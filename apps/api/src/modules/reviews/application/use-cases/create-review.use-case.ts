import { ForbiddenException, Injectable } from '@nestjs/common';
import { ReviewsRepository } from '../ports/reviews.repository';

/**
 * Crear/actualizar reseña (RF-MKT-005). Solo puede reseñar quien compró ese
 * producto (compra verificada), para evitar reseñas de quien nunca lo tuvo.
 */
@Injectable()
export class CreateReviewUseCase {
  constructor(private readonly reviews: ReviewsRepository) {}

  async execute(userId: string, productId: string, rating: number, comment?: string): Promise<void> {
    const purchased = await this.reviews.hasPurchasedProduct(userId, productId);
    if (!purchased) {
      throw new ForbiddenException('Solo puedes reseñar productos que compraste.');
    }
    await this.reviews.upsert(userId, productId, rating, comment);
  }
}
