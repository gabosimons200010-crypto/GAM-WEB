import { ForbiddenException } from '@nestjs/common';
import { CreateReviewUseCase } from './create-review.use-case';
import { ReviewsRepository, ReviewView } from '../ports/reviews.repository';

class FakeReviews extends ReviewsRepository {
  public upserted?: { userId: string; productId: string; rating: number; comment?: string };
  constructor(private readonly purchased: boolean) {
    super();
  }
  async hasPurchasedProduct(): Promise<boolean> {
    return this.purchased;
  }
  async upsert(userId: string, productId: string, rating: number, comment?: string): Promise<void> {
    this.upserted = { userId, productId, rating, comment };
  }
  async listForProduct(): Promise<ReviewView[]> {
    return [];
  }
}

describe('CreateReviewUseCase', () => {
  it('crea la reseña cuando el usuario compró el producto', async () => {
    const reviews = new FakeReviews(true);
    await new CreateReviewUseCase(reviews).execute('u1', 'p1', 5, 'genial');
    expect(reviews.upserted).toEqual({ userId: 'u1', productId: 'p1', rating: 5, comment: 'genial' });
  });

  it('rechaza (403) si el usuario no compró el producto', async () => {
    const reviews = new FakeReviews(false);
    await expect(new CreateReviewUseCase(reviews).execute('u1', 'p1', 5)).rejects.toBeInstanceOf(ForbiddenException);
    expect(reviews.upserted).toBeUndefined();
  });
});
