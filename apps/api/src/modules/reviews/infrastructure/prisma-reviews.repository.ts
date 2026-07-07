import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ReviewsRepository, ReviewView } from '../application/ports/reviews.repository';

@Injectable()
export class PrismaReviewsRepository extends ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async upsert(userId: string, productId: string, rating: number, comment?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.review.findFirst({ where: { userId, productId } });
      if (existing) {
        await tx.review.update({ where: { id: existing.id }, data: { rating, comment: comment ?? null } });
      } else {
        await tx.review.create({ data: { userId, productId, rating, comment: comment ?? null } });
      }
      // Recalcula el promedio y el conteo en el producto (los usa la vitrina).
      const agg = await tx.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
      await tx.product.update({
        where: { id: productId },
        data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
      });
    });
  }

  async listForProduct(productId: string): Promise<ReviewView[]> {
    const rows = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName: r.user.fullName ?? 'Cliente',
    }));
  }
}
